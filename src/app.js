let courses = []

let counter = 0

let busy = {}

let schedule = {
  1: new Array(40).fill(null),
  2: new Array(40).fill(null),
  3: new Array(40).fill(null),
  4: new Array(40).fill(null)
}

let classrooms = {}

class Course {
  constructor (
    code,
    name,
    year,
    credit,
    type,
    dept,
    num_students,
    instructor,
    block
  ) {
    this.code = code
    this.year = year
    this.num_students = num_students
    this.instructor = instructor
    this.block = block
    this.hours = 0
  }
}

const app = Vue.createApp({
  /* root component options */
  data () {
    return {}
  },
  methods: {
    printTest () {
      // Print busy counter
      console.log('Busy Counter:')
      console.log(busy)

      // Print courses
      console.log('Courses:')
      console.log(courses)

      // Print counter
      console.log('Counter:', counter)

      // Print classrooms
      console.log('Classrooms:')
      console.log(classrooms)
    },
    loadCourses () {
      fetch('data/courses.csv')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load courses')
          }
          return response.text()
        })
        .then(data => {
          // Split the CSV data into rows
          const rows = data.split('\n')

          // Parse each row into course objects
          rows.forEach(row => {
            const columns = row.split(',')
            const course = new Course(
              columns[0].trim(),
              columns[1].trim(),
              parseInt(columns[2]),
              parseInt(columns[3]),
              columns[4].trim(),
              columns[5].trim(),
              parseInt(columns[6]),
              columns[7].trim(),
              parseInt(columns[8])
            )
            courses.push(course)
          })

          console.log('Courses loaded:', courses)
        })
        .catch(error => {
          console.log('loadCourses error')
          this.showError(error.message)
        })
    },
    findCourse (code) {
      const foundCourse = courses.find(course => course.code === code)
      if (foundCourse) {
        console.log('Found course:', foundCourse)
        return foundCourse
      } else {
        this.showError(`Course with code ${code} not found.`)
        return null
      }
    },
    loadClassrooms () {
      fetch('data/classroom.csv')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load classrooms')
          }
          return response.text()
        })
        .then(data => {
          // Split the CSV data into rows
          const rows = data.split('\n')

          // Parse each row into classroom objects
          rows.forEach(row => {
            const [name, capacity] = row.split(',')
            const classroomName = name.trim()
            const classroomCapacity = parseInt(capacity.trim())
            classrooms[classroomName] = classroomCapacity
          })

          console.log('Classrooms loaded:', classrooms)
        })
        .catch(error => {
          console.log('loadClassrooms error')
          this.showError(error.message)
        })
    },
    findClassroom (course, hour) {
      // Finds the smallest class suitable then returns it.
      let foundClassroom = null

      for (const m in classrooms) {
        if (classrooms[m] >= course.num_students) {
          let flag = false

          // Is the classroom assigned to any other class in this hour?
          // Check for every hour in the block.
          for (let k of [1, 2, 3, 4]) {
            for (let j = 0; j < course.hours; j++) {
              if (
                this.schedule[k][hour + j] &&
                this.schedule[k][hour + j][1] !== null
              ) {
                if (this.schedule[k][hour + j][1] === m) {
                  flag = true
                  break
                }
              }
            }
          }

          if (!flag) {
            foundClassroom = m
            break
          }
        }
      }

      return foundClassroom
    },
    readBusy (data) {
      for (let line of data.split('\n')) {
        let [instructor, day] = line.trim().split(',', 2)
        let timeSlots = line.trim().split('"')[1]
        let slots = timeSlots.replace(/"/g, '').split(',')

        const times = []
        for (const slot of slots) {
          const hour =
            parseInt(slot.split(':')[0]) -
            8 +
            8 *
              {
                Monday: 0,
                Tuesday: 1,
                Wednesday: 2,
                Thursday: 3,
                Friday: 4
              }[day]
          times.push(hour)
        }
        if (busy[instructor] !== undefined) {
          busy[instructor].push(...times)
        } else {
          busy[instructor] = times
        }
      }
    },
    loadBusy () {
      fetch('data/busy.csv')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load busy schedule')
          }
          return response.text()
        })
        .then(data => {
          this.readBusy(data)
        })
        .catch(error => {
          console.error('Error:', error.message)
        })
    },
    lay (year = 1, hour = 0) {
      counter++
      if (hour >= 40) {
        return this.lay(year + 1, 0)
      }

      if (year > 4) {
        return courses.length === 0
      }

      // Try every course if it ever fits.
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i]

        if (course.year !== year) {
          // Is the course for this year?
          continue
        }

        let classroom = this.findClassroom(course, hour)

        if (
          this.checkHourAvailable(year, hour, course, course.hours) &&
          classroom
        ) {
          schedule[year].fill([course, classroom], hour, hour + course.hours)
          counter++
          courses.splice(i, 1)

          // Recursive call
          if (this.lay(year, hour + course.hours)) {
            return true
          } else {
            // Failed: backtracking.
            schedule[year].fill(null, hour, hour + course.hours)
            courses.push(course)
            counter++
            return false
          }
        }
      }
      return this.lay(year, hour + 1)
    },
    checkHourAvailable (year, hour, course, block) {
      // 6.saate 3 saatlik ders koyulamaz.
      if (block === 3) {
        if (hour % 8 === 6 || hour % 7 === 0) return false
      }

      // 7.saate 2 saatlik ders koyulamaz.
      if (block === 2) {
        if (hour % 8 === 7) return false
      }

      // Same lesson can't be in same day multiple times
      for (let z = hour - (hour % 8); z < hour - (hour % 8) + block; z++) {
        if (
          schedule[year][z] !== null &&
          course.code === schedule[year][z][0].code
        ) {
          return false
        }
      }

      for (let j = 0; j < block; j++) {
        // Every hour of the block to be empty
        if (schedule[year][hour + j] !== null) {
          return false
        }

        // ıs it busy hour for the instructor?
        if (
          busy[course.instructor] !== undefined &&
          busy[course.instructor].includes(hour + j)
        ) {
          return false
        }

        // Instructor can only have one lecture at a time.
        for (let i = 1; i <= 4; i++) {
          if (
            schedule[i][hour + j] !== null &&
            schedule[i][hour + j][0].instructor === course.instructor
          ) {
            return false
          }
        }
      }

      return true
    },
    displayScheduleAsHTML (schedule) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      const table = document.createElement('table')
      const thead = document.createElement('thead')
      const tbody = document.createElement('tbody')

      // Create table headers
      const headerRow = document.createElement('tr')
      headerRow.innerHTML = '<th>Hour</th>'
      for (let year = 1; year <= 4; year++) {
        const th = document.createElement('th')
        th.textContent = `Year ${year}`
        headerRow.appendChild(th)
      }
      thead.appendChild(headerRow)
      table.appendChild(thead)

      // Create table body
      for (let hour = 0; hour < 40; hour++) {
        // Adjusted loop range to cover all hours of the week
        const row = document.createElement('tr')
        const dayIndex = Math.floor(hour / 8) // Calculate dayIndex based on hour
        const hourLabel = `${days[dayIndex]} ${(hour % 8) + 8}:30`

        // Create hour cell
        const hourCell = document.createElement('td')
        hourCell.textContent = hourLabel
        row.appendChild(hourCell)

        // Create cells for each year
        for (let year = 1; year <= 4; year++) {
          const course = schedule[year][hour]
          const cell = document.createElement('td')
          if (course) {
            const courseCode = course[0].code
            const instructor = course[0].instructor.split(` `).slice(-1)[0]
            cell.textContent = `${courseCode} ${course[1]} ${instructor}`
          }
          row.appendChild(cell)
        }

        tbody.appendChild(row)
      }

      table.appendChild(tbody)
      document.body.appendChild(table)
    },
    addCourse () {
      console.log('Course button')
    },
    editBusyHours () {
      console.log('Busy button')
    },
    addClass () {
      console.log('Class button')
    },
    makeSchedule () {
      console.log('Schedule button')
      if (this.lay()) {
        this.displayScheduleAsHTML(schedule)
      } else {
        console.log('Failed')
      }
    },
    showError (message) {
      alert(`Error: ${message}`)
    }
  },
  mounted () {
    this.loadCourses()
    this.loadClassrooms()
    this.loadBusy()
  }
})

app.mount('#app')
