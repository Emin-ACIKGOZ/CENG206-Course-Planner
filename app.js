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
    return {
      // Existing data properties...
      showAddCourseForm: false,
      newCourse: {
        code: '',
        name: '',
        year: '',
        credit: '',
        type: '',
        dept: '',
        num_students: '',
        instructor: '',
        block: ''
      },
      // Add new properties for adding a class
      showAddClassForm: false,
      newClass: {
        classroomId: '',
        capacity: ''
      },
      errors: {},
      showSuccessMessage: false
    }
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
          const rows = data.split(/\r?\n/)

          // Parse each row into course objects
          rows.forEach(row => {
            if (row.trim() === '') {
              return // Skip empty strings
            }
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
          console.log(error.message)
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
          console.log(data)
          // Split the CSV data into rows
          const rows = data.split(/\r?\n/)
          console.log(rows)

          // Parse each row into classroom objects
          rows.forEach(row => {
            if (row.trim() === '') {
              return // Skip empty strings
            }

            const rowArray = row.split(';')
            const classroomName = rowArray[0].trim()
            const classroomCapacity = parseInt(rowArray[1].trim(), 10)
            classrooms[classroomName] = classroomCapacity
          })

          console.log('Classrooms loaded:', classrooms)
        })
        .catch(error => {
          console.log('loadClassrooms error')
          console.log(error.message)
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
    loadBusy () {
      fetch('data/busy.csv')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load busy schedule')
          }
          return response.text()
        })
        .then(data => {
          // Split the CSV data into rows
          const rows = data.split(/\r?\n/)

          // Parse each row into busy schedule
          rows.forEach(line => {
            if (line.trim() === '') {
              return // Skip empty lines
            }

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
          })

          console.log('Busy schedule loaded:', busy)
          console.log(busy[0].times)
        })
        .catch(error => {
          console.error('loadBusy error:', error.message)
          // Handle error as needed
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
    addCourse () {
      this.showAddCourseForm = true
    },
    cancelAddCourse () {
      this.showAddCourseForm = false
      this.clearNewCourse()
    },
    submitCourse () {
      // Validate the new course
      if (this.validateNewCourse()) {
        // Add the course to the list of courses
        courses.push(
          new Course(
            this.newCourse.code,
            this.newCourse.name,
            parseInt(this.newCourse.year),
            parseInt(this.newCourse.credit),
            this.newCourse.type,
            this.newCourse.dept,
            parseInt(this.newCourse.num_students),
            this.newCourse.instructor,
            parseInt(this.newCourse.block)
          )
        )
        // Show success message
        this.showSuccessMessage = true
        // Clear the form and hide it after a delay
        console.log(courses) //test
        setTimeout(() => {
          this.clearNewCourse()
          //this.showAddCourseForm = false
          this.showSuccessMessage = false
        }, 2000) // Adjust the delay as needed
      }
    },
    validateNewCourse () {
      // Reset errors
      this.errors = {}

      // Perform validation for each field
      let isValid = true
      if (!this.newCourse.code) {
        this.errors.code = 'Course code is required'
        isValid = false
      }
      if (!this.newCourse.name) {
        this.errors.name = 'Course name is required'
        isValid = false
      }
      if (
        !this.newCourse.year ||
        isNaN(this.newCourse.year) ||
        this.newCourse.year < 1 ||
        this.newCourse.year > 6
      ) {
        this.errors.year = 'Year must be a number between 1 and 6'
        isValid = false
      }
      if (
        !this.newCourse.credit ||
        isNaN(this.newCourse.credit) ||
        this.newCourse.credit <= 0
      ) {
        this.errors.credit = 'Credit must be a number greater than zero'
        isValid = false
      }
      if (
        !this.newCourse.type ||
        !['C', 'E'].includes(this.newCourse.type.toUpperCase())
      ) {
        this.errors.type = 'Type must be C or E'
        isValid = false
      }
      if (
        !this.newCourse.dept ||
        !['D', 'S'].includes(this.newCourse.dept.toUpperCase())
      ) {
        this.errors.dept = 'Department must be D or S'
        isValid = false
      }
      if (
        !this.newCourse.num_students ||
        isNaN(this.newCourse.num_students) ||
        this.newCourse.num_students <= 0
      ) {
        this.errors.num_students =
          'Number of students must be a number greater than zero'
        isValid = false
      }
      if (!this.newCourse.instructor) {
        this.errors.instructor = 'Instructor name is required'
        isValid = false
      }
      if (
        !this.newCourse.block ||
        !/^(\d+|\d+\+\d+)$/.test(this.newCourse.block)
      ) {
        this.errors.block = 'Block must be in the format of 3 or 2+1'
        isValid = false
      }

      return isValid
    },
    clearNewCourse () {
      // Clear the new course object
      this.newCourse = {
        code: '',
        name: '',
        year: '',
        credit: '',
        type: '',
        dept: '',
        num_students: '',
        instructor: '',
        block: ''
      }
      // Reset errors
      this.errors = {}
    },
    editBusyHours () {
      console.log('Busy button')
    },
    addClass () {
      this.showAddClassForm = true
    },
    cancelAddClass () {
      this.showAddClassForm = false
      this.clearNewClass()
    },
    submitClass () {
      // Validate the new class
      if (this.validateNewClass()) {
        // Add the class
        const classroomName = this.newClass.classroomId.trim()
        const classroomCapacity = parseInt(this.newClass.capacity)

        // Check if the classroom already exists
        if (classrooms[classroomName] !== undefined) {
          this.errors.classroomId = 'Classroom ID already exists'
          return
        }

        // Add the new classroom to the classrooms object
        classrooms[classroomName] = classroomCapacity

        // Show success message
        this.showSuccessMessage = true

        // Clear the form and hide it after a delay
        setTimeout(() => {
          this.clearNewClass()
          this.showSuccessMessage = false
        }, 2000) // Adjust the delay as needed
      }
    },
    validateNewClass () {
      // Reset errors
      this.errors = {}

      // Perform validation for each field
      let isValid = true
      if (!this.newClass.classroomId) {
        this.errors.classroomId = 'Classroom ID is required'
        isValid = false
      }
      if (!this.newClass.capacity || this.newClass.capacity <= 0) {
        this.errors.capacity = 'Capacity must be a number greater than zero'
        isValid = false
      }

      return isValid
    },
    clearNewClass () {
      // Clear the new class object
      this.newClass = {
        classroomId: '',
        capacity: ''
      }
      // Reset errors
      this.errors = {}
    },
    makeSchedule () {
      console.log('Schedule button')
      if (this.lay()) {
        //this.displayScheduleAsHTML(schedule) showSchedule
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
