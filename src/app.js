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
    this.credit = credit
    this.type = type
    this.dept = dept
    this.name = name
    this.year = year
    this.num_students = num_students
    this.instructor = instructor
    this.hours = 0
    this.block = block
  }
}

const app = Vue.createApp({
  data () {
    return {
      //Arrays to store relevant data
      classrooms: {},
      courses: [],
      busy: {},
      service: {},
      schedule: {
        1: new Array(40).fill(null),
        2: new Array(40).fill(null),
        3: new Array(40).fill(null),
        4: new Array(40).fill(null)
      },
      weekdays: {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4
      },
      // Forms and boolean flags for forms
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
        hours: ''
      },
      // Add new properties for adding a class
      // Add new properties for adding a class
      showAddClassForm: false,
      newClass: {
        classroomId: '',
        capacity: ''
      },
      // New properties for adding a busy hour
      showAddBusyForm: false,
      newBusyHour: {
        instructor: '',
        day: '',
        hour: ''
      },
      errors: {},
      showSuccessMessage: false,
      activeAccordion: `courses`
    }
  },

  methods: {
    //General purpose function to show errors on a page
    getHourRange (day) {
      let s = day * 8
      let e = s + 8

      let hourRange = []
      for (let i = s; i < e; i++) {
        hourRange.push(i)
      }

      return hourRange
    },

    getDayColor (hour) {
      switch (Math.floor(hour / 8)) {
        case 0:
          return '#d9ffff'
        case 1:
          return 'pink'
        case 2:
          return '#fff6b9'
        case 3:
          return '#f7ffc7'
        case 4:
          return 'aquamarine'
        default:
          return '' // Default color, if no condition matches
      }
    },

    showError (message) {
      alert(`Error: ${message}`)
    },

    toggleAccordion (accordionName) {
      this.activeAccordion =
        this.activeAccordion === accordionName ? null : accordionName
    },

    deleteCourse (code) {
      const courseIndex = this.courses.findIndex(course => course.code === code)
      if (courseIndex !== -1) {
        this.courses.splice(courseIndex, 1)
      }
    },

    // for printing rows when printing
    notInMiddle (schedule, hour, year) {
      console.log(schedule)

      if (schedule[year][hour - 1] === null) {
        return true
      } else {
        if (hour % 8 === 0) {
          // beginning of a day
          return true
        } else if (
          schedule[year][hour][0].code === schedule[year][hour - 1][0].code
        ) {
          return false
        } else {
          return true
        }
      }
    },

    //Loading Methods
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
              columns[8]
            )
            this.courses.push(course)
          })

          console.log('Courses loaded:', this.courses)
        })
        .catch(error => {
          console.log('loadCourses error')
          console.log(error.message)
          this.showError(error.message)
        })
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
            this.classrooms[classroomName] = classroomCapacity
          })

          console.log('Classrooms loaded:', this.classrooms)
        })
        .catch(error => {
          console.log('loadClassrooms error')
          console.log(error.message)
          this.showError(error.message)
        })
    },

    loadService () {
      fetch('data/service.csv')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load service schedule')
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

            let [course, day] = line.trim().split(',', 2)
            let timeSlots = line.trim().split('"')[1]
            let slots = timeSlots.replace(/"/g, '').split(',')

            const times = []
            for (const slot of slots) {
              const hour =
                parseInt(slot.split(':')[0]) - 8 + 8 * this.weekdays[day]
              times.push(hour)
            }
            if (this.service[course] !== undefined) {
              this.service[course].push(...times)
            } else {
              this.service[course] = times
            }
          })

          console.log('Service hours added to schedule:', this.service)
        })
        .catch(error => {
          console.error('loadService error:', error.message)
          // Handle error as needed
        })
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
                parseInt(slot.split(':')[0]) - 8 + 8 * this.weekdays[day]
              times.push(hour)
            }
            if (this.busy[instructor] !== undefined) {
              this.busy[instructor].push(...times)
            } else {
              this.busy[instructor] = times
            }
          })

          console.log('Busy schedule loaded:', this.busy)
        })
        .catch(error => {
          console.error('loadBusy error:', error.message)
          // Handle error as needed
        })
    },
    //Methods for showCourses button
    showCourses () {
      console.log('Show Courses Button')
    },

    //Methods for editCourses button
    editCourses () {
      console.log('Edit Courses Button')
    },

    //Methods for addCourse button
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
        this.courses.push(
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
        console.log(this.courses) //test
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
        // should be remove because selection box
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

    //Methods for addBusyHour button
    addBusyHour () {
      this.showAddBusyForm = true
    },
    cancelAddBusyHour () {
      this.showAddBusyForm = false
      this.clearNewBusyHour()
    },
    submitBusyHour () {
      // Validate the new busy hour
      if (this.validateNewBusyHour()) {
        // Extract input values
        const instructorName = this.newBusyHour.instructor.trim()
        const selectedDay = this.newBusyHour.day
        const selectedHour = this.newBusyHour.hour // Change from hours to hour

        // Process selected hour
        const processedHour =
          parseInt(selectedHour) - 8 * (1 + 1 * this.weekdays[selectedDay]) // Change from hours to hour

        // Check if the instructor is already busy during selected hour
        const busyTimes = this.busy[instructorName] // Move this line outside the loop
        if (busyTimes && busyTimes.includes(processedHour)) {
          // Use processedHour instead of processedHours
          this.errors.busyHour = `Instructor is already busy at ${
            processedHour + 8 * (1 + 1 * this.weekdays[selectedDay])
          }:30`
          return
        }

        // Add the new busy hour to the busy schedule
        if (!this.busy[instructorName]) {
          this.busy[instructorName] = []
        }
        this.busy[instructorName].push(processedHour) // Change processedHours to processedHour
        console.log(this.busy) // Debugging

        // Show success message
        this.showSuccessMessage = true

        // Clear the form and hide it after a delay
        setTimeout(() => {
          this.clearNewBusyHour()
          this.showSuccessMessage = false
        }, 2000) // Adjust the delay as needed
      }
    },
    validateNewBusyHour () {
      // Reset errors
      this.errors = {}

      // Perform validation for each field
      let isValid = true
      if (!this.newBusyHour.instructor) {
        this.errors.instructor = 'Instructor name is required'
        isValid = false
      }
      if (!this.newBusyHour.day) {
        this.errors.day = 'Day of the week is required'
        isValid = false
      }
      if (!this.newBusyHour.hour) {
        this.errors.hour = 'At least one hour must be selected'
        isValid = false
      }

      return isValid
    },
    clearNewBusyHour () {
      // Clear the new busy hour object
      this.newBusyHour = {
        instructor: '',
        day: '',
        hours: []
      }
      // Reset errors
      this.errors = {}
    },

    //Methods for editBusyHours button
    editBusyHours () {
      console.log('Edit Busy button')
    },

    //Methods for addClass button
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
        if (this.classrooms[classroomName] !== undefined) {
          this.errors.classroomId = 'Classroom ID already exists'
          return
        }

        // Add the new classroom to the classrooms object
        this.classrooms[classroomName] = classroomCapacity

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

    // Functions for makeSchedule button
    findCourse (code) {
      const foundCourse = this.courses.find(course => course.code === code)
      if (foundCourse) {
        //console.log('Found course:', foundCourse)
        return foundCourse
      } else {
        this.showError(`Course with code ${code} not found.`)
        return null
      }
    },

    findClassroom (course, hour) {
      let classroom = null

      for (const m in this.classrooms) {
        if (this.classrooms[m] > course.num_students) {
          var flag = false

          for (let k of [1, 2, 3, 4]) {
            // Check for the every hour in block.
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
            classroom = m
            break
          }
        }
      }
      return classroom
    },

    layService (courses) {
      // this logic is sort of wrong
      // WONT WORK IF HOURS ARE LISTED LIKE 9:30 8:30 10:30

      for (const code in this.service) {
        const hours = this.service[code]
        const course = courses.find(course => course.code === code)

        hours.sort((a, b) => a - b)

        let hour = hours[0]
        let classroom = this.findClassroom(course, hour)

        if (classroom === null) {
          throw new Error("Can't find a classroom for: " + course.code)
        }

        if (this.checkHourAvailable(course.year, hour, course, course.hours)) {
          this.schedule[course.year].fill(
            [course, classroom],
            hour,
            hour + course.hours
          )
        } else {
          // hatalar
        }

        courses.splice(
          courses.findIndex(c => c.code === course.code),
          1
        )
      }
    },

    lay (courses, year = 1, hour = 0) {
      if (hour >= 40) {
        return this.lay(courses, year + 1, 0)
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
          this.schedule[year].fill(
            [course, classroom],
            hour,
            hour + course.hours
          )

          courses.splice(i, 1)

          // Recursive call
          if (this.lay(courses, year, hour + course.hours)) {
            return true
          } else {
            // Failed: backtracking.
            this.schedule[year].fill(null, hour, hour + course.hours)
            courses.push(course)

            return false
          }
        }
      }
      return this.lay(courses, year, hour + 1)
    },

    checkHourAvailable (year, hour, course, block) {
      // You cannot put a 3 hour lesson at the 6. hour of a day (Not enough time)
      if (block === 3) {
        if (hour % 8 === 6 || hour % 7 === 0) return false
      }

      // You cannot put a 2 hour lesson at the 7. hour of a day (Not enough time)
      if (block === 2) {
        if (hour % 8 === 7) return false
      }

      // Same lesson cannot occur in the same day multiple times
      for (let z = hour - (hour % 8); z < hour - (hour % 8) + block; z++) {
        if (
          this.schedule[year][z] !== null &&
          course.code === this.schedule[year][z][0].code
        ) {
          return false
        }
      }

      for (let j = 0; j < block; j++) {
        // Returns false if every hour of the block is NOT empty
        if (this.schedule[year][hour + j] !== null) {
          return false
        }

        // Returns false if the course falls on the busy hour of the instructor of the course
        if (
          this.busy[course.instructor] !== undefined &&
          this.busy[course.instructor].includes(hour + j)
        ) {
          return false
        }

        // Returns false if the instructor has more than one class at the same time (Illegal state)
        for (let i = 1; i <= 4; i++) {
          if (
            this.schedule[i][hour + j] !== null &&
            this.schedule[i][hour + j][0].instructor === course.instructor
          ) {
            return false
          }
        }
      }

      return true
    },

    toHour (integer) {
      return (integer % 8) + 8 + ':30'
    },

    makeSchedule () {
      activeAccordion = 'schedule'
      console.log('Schedule button')
      let courses = JSON.parse(JSON.stringify(this.courses))

      this.schedule = {
        1: new Array(40).fill(null),
        2: new Array(40).fill(null),
        3: new Array(40).fill(null),
        4: new Array(40).fill(null)
      }

      courses.forEach(course => {
        if (course.block === '2+1') {
          course.hours = 1
          let course2 = JSON.parse(JSON.stringify(course))
          course2.hours = 2
          courses.push(course2)
        } else {
          course.hours = 3
        }
      })

      this.layService(courses)

      if (this.lay(courses)) {
        this.toggleAccordion('schedule')
        console.log(schedule)
      } else {
        console.log('Failed to create a schedule.')
      }
    }
  },

  //Runs upon mounting
  mounted () {
    //Empty for now
  },

  //Runs upon creation
  created () {
    this.loadCourses()
    this.loadClassrooms()
    this.loadBusy()
    this.loadService()
  }
})

app.mount('#app')
