class Course {
  constructor(
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
  data() {
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

      selectedFile: null, // Seçilen dosyayı saklamak için bir değişken

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
      successWhenLaying: false,
      showAddClassForm: false,
      showEditCourseForm: false,
      selectedHours: [],
      showEditClassForm: false,
      editingCourse: null,
      editingService: null,
      showEditBusyForm: false,
      showEditServiceForm: false,
      editingInstructor: null,
      editingClass: null,
      editingInstructor: null,
      newClass: {
        classroomId: '',
        capacity: ''
      },
      // New properties for adding a busy hour
      showAddBusyForm: false,
      showAddServiceForm: false,
      newBusyHour: {
        instructor: '',
        day: '',
        hour: ''
      },
      newServiceHour: {
        course: '',
        day: '',
        hour: '',
        dayAlt: '',
        hourAlt: ''
      },
      errors: {},
      showSuccessMessage: false,
      activeAccordion: `null`
    }
  },

  methods: {


    importCourse(event) {

      this.courses = []
      // Seçilen dosyayı al
      const file = event.target.files[0];

      // Dosya okuma işlemi
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result; // Dosya içeriği
        // CSV içeriğini parçalayarak kurs objeleri oluşturma
        const coursesData = content.split(/\r?\n/);
        coursesData.forEach(row => {
          if (!row) {
            return // Skip empty strings
          }
          const columns = row.split(',')
          if (!this.isValidCourseData(columns)) {
            console.log('Skipped Invalid Entry: ' + columns)
            return // Skip invalid data
          }
          const course = new Course(
            columns[0].trim(),
            columns[1].trim(),
            parseInt(columns[2]),
            parseInt(columns[3]),
            columns[4].trim().toUpperCase(),
            columns[5].trim().toUpperCase(),
            parseInt(columns[6]),
            columns[7].trim(),
            columns[8]
          )
          this.courses.push(course)
        });
        console.log('Courses loaded:', this.courses); // Konsola yüklenen kursları yazdır
      };
      reader.readAsText(file); // Dosya içeriğini oku
    },
    importService(event) {

      this.service = {}
      const file = event.target.files[0]; // Get the selected file
    
      const reader = new FileReader(); // Create a new FileReader instance
    
      reader.onload = () => {
        const content = reader.result; // Get the content of the loaded file
    
        // Split the CSV data into rows
        const rows = content.split(/\r?\n/);
    
        // Parse each row into busy schedule
        rows.forEach(row => {
          if (!this.isValidRowData(row)) {
            console.log('Skipping invalid entry: ' + row);
            return; // Skip invalid rows
          }
    
          let [course, day] = row.trim().split(',', 2);
          let timeSlots = row.trim().split('"')[1];
          let slots = timeSlots.replace(/"/g, '').split(',');
    
          const times = [];
          for (const slot of slots) {
            const hour = parseInt(slot.split(':')[0]) - 8 + 8 * this.weekdays[day];
            times.push(hour);
          }
          if (this.service[course] !== undefined) {
            this.service[course].push(...times);
          } else {
            this.service[course] = times;
          }
        });
    
        console.log('Service hours added to schedule:', this.service);
      };
    
      reader.readAsText(file); // Read the content of the file as text
    },
    importBusy(event) {

      this.busy = {}
      const file = event.target.files[0]; // Get the selected file
    
      const reader = new FileReader(); // Create a new FileReader instance
    
      reader.onload = () => {
        const content = reader.result; // Get the content of the loaded file
    
        // Split the CSV data into rows
        const rows = content.split(/\r?\n/);
    
        // Parse each row into busy schedule
        rows.forEach(row => {
          if (!this.isValidRowData(row)) {
            console.log('Skipping invalid entry: ' + row);
            return; // Skip invalid rows
          }
    
          let [instructor, day] = row.trim().split(',', 2);
          let timeSlots = row.trim().split('"')[1];
          let slots = timeSlots.replace(/"/g, '').split(',');
    
          const times = [];
          for (const slot of slots) {
            const hour = parseInt(slot.split(':')[0]) - 8 + 8 * this.weekdays[day];
            times.push(hour);
          }
          if (this.busy[instructor] !== undefined) {
            this.busy[instructor].push(...times);
          } else {
            this.busy[instructor] = times;
          }
        });
    
        console.log('Busy schedule loaded:', this.busy);
      };
    
      reader.readAsText(file); // Read the content of the file as text
    },    
    importClassroom(event) {
      this.classroom = {}
      const file = event.target.files[0]; // Get the selected file
    
      const reader = new FileReader(); // Create a new FileReader instance
    
      reader.onload = () => {
        const content = reader.result; // Get the content of the loaded file
    
        // Split the CSV data into rows
        const rows = content.split(/\r?\n/);
    
        // Parse each row into classroom objects
        rows.forEach(row => {
          if (!row) {
            return; // Skip empty strings
          }
    
          const data = row.split(';');
          if (!this.isValidClassroomData(data)) {
            console.log('Skipping invalid entry: ' + data);
            return;
          }
          const classroomName = data[0].trim();
          const classroomCapacity = parseInt(data[1].trim(), 10);
          this.classrooms[classroomName] = classroomCapacity;
        });
    
        console.log('Classrooms loaded:', this.classrooms);
      };
    
      reader.readAsText(file); // Read the content of the file as text
    },    
    // İçe aktarma modülünü açma işlevi
    openImport(inputId) {
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.click(); // Open the file selection window
      } else {
        console.error(`File input element with id '${inputId}' not found.`);
      }
    },
    
    //General purpose function to show errors on a page
    getHourRange(day) {
      let s = day * 8
      let e = s + 8

      let hourRange = []
      for (let i = s; i < e; i++) {
        hourRange.push(i)
      }

      return hourRange
    },

    getDayColor(hour) {
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

    showError(message) {
      alert(`Error: ${message}`)
    },

    toggleAccordion(accordionName) {
      this.activeAccordion =
        this.activeAccordion === accordionName ? null : accordionName
    },

    deleteCourse(code) {
      const courseIndex = this.courses.findIndex(course => course.code === code)
      if (courseIndex !== -1) {
        this.courses.splice(courseIndex, 1)
      }
    },

    deleteBusy(instructor) {
      if (this.busy[instructor] !== undefined) {
        delete this.busy[instructor];
        console.log(`Busy hours for ${instructor} deleted successfully.`);
      } else {
        console.log(`No busy hours found for ${instructor}.`);
      }
    },

    deleteService(course) {
      if (this.service[course] !== undefined) {
        delete this.service[course];
        console.log(`Service hours for ${course} deleted successfully.`);
      } else {
        console.log(`No service hours found for ${course}.`);
      }
    },

    // for printing rows when printing
    notInMiddle(schedule, hour, year) {
      if (!schedule[year][hour - 1] || !schedule[year][hour]) {
        return true;
      } else {
        if (hour % 8 === 0) {
          // beginning of a day
          return true;
        } else if (
          schedule[year][hour][0].code === schedule[year][hour - 1][0].code
        ) {
          return false;
        } else {
          return true;
        }
      }
    },

    //Loading Methods
    isValidCourseData(columns) {
      // Validation rules
      if (columns.length !== 9) {
        return false
      }
      const isValidYear = parseInt(columns[2]) >= 1 && parseInt(columns[2]) <= 4
      const isValidCredit = parseInt(columns[3]) > 0
      const isValidType = ['C', 'E'].includes(columns[4].trim().toUpperCase())
      const isValidDept = ['D', 'S'].includes(columns[5].trim().toUpperCase())
      const isValidBlock = ['2+1', '3'].includes(columns[8].trim())
      const isValidNumStudents = parseInt(columns[6]) > 0

      return (
        isValidYear &&
        isValidCredit &&
        isValidType &&
        isValidDept &&
        isValidBlock &&
        isValidNumStudents
      )
    },

    loadCourses() {
      fetch('src/data/courses.csv')
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
            if (!row) {
              return // Skip empty strings
            }
            const columns = row.split(',')
            if (!this.isValidCourseData(columns)) {
              console.log('Skipped Invalid Entry: ' + columns)
              return // Skip invalid data
            }
            const course = new Course(
              columns[0].trim(),
              columns[1].trim(),
              parseInt(columns[2]),
              parseInt(columns[3]),
              columns[4].trim().toUpperCase(),
              columns[5].trim().toUpperCase(),
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

    isValidClassroomData(data) {
      return (
        data.length === 2 &&
        parseInt(data[1]) > 0
      );
    },

    loadClassrooms() {
      fetch('src/data/classroom.csv')
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
            if (!row) {
              return // Skip empty strings
            }

            const data = row.split(';')
            if (!this.isValidClassroomData(data)) {
              console.log('Skipping invalid entry: ' + data)
              return
            }
            const classroomName = data[0].trim()
            const classroomCapacity = parseInt(data[1].trim(), 10)
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

    isValidRowData(row) {
      const validHours = new Set(['8:30', '9:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30']);
      const parts = row.trim().split('"').join('').split(",");

      const [course, day, ...slots] = parts;

      if (!course || !day || slots.length === 0) {
        return false;
      }

      const slotsSet = new Set(slots);
      if (slotsSet.size !== slots.length) {
        return false; // Check for uniqueness
      }

      for (let slot of slots) {
        if (!validHours.has(slot)) {
          return false; // Check if each slot is a valid hour
        }
      }

      return true; // If all conditions pass
    },

    loadService() {
      fetch('src/data/service.csv')
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
          rows.forEach(row => {
            if (!this.isValidRowData(row)) {
              console.log('Skipping invalid entry: ' + row)
              return // Skip invalid rows
            }

            let [course, day] = row.trim().split(',', 2)
            let timeSlots = row.trim().split('"')[1]
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

    loadBusy() {
      fetch('src/data/busy.csv')
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
          rows.forEach(row => {
            if (!this.isValidRowData(row)) {
              console.log('Skipping invalid entry: ' + row)
              return // Skip invalid rows
            }

            let [instructor, day] = row.trim().split(',', 2)
            let timeSlots = row.trim().split('"')[1]
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
    showCourses() {
      console.log('Show Courses Button')
    },
    //Methods for editCourses button
    editCourse(code) {
      this.editingCourse = this.findCourse(code);
      if (this.editingCourse) {
        this.newCourse = Object.assign({}, this.editingCourse);
        this.showEditCourseForm = true;
      } else {

      }
    },
    cancelEditCourse() {
      this.showEditCourseForm = false
      this.editingCourse = null;
      this.clearNewCourse()
    },
    editSubmitCourse() {
      // Validate the edited course

      if (this.validateNewCourse()) {
        // Update the course in the list of courses
        this.editingCourse.code = this.newCourse.code;
        this.editingCourse.name = this.newCourse.name;
        this.editingCourse.year = parseInt(this.newCourse.year);
        this.editingCourse.credit = parseInt(this.newCourse.credit);
        this.editingCourse.type = this.newCourse.type;
        this.editingCourse.dept = this.newCourse.dept;
        this.editingCourse.num_students = parseInt(this.newCourse.num_students);
        this.editingCourse.instructor = this.newCourse.instructor;
        this.editingCourse.block = this.newCourse.block;

        // Show success message
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.showSuccessMessage = false;
          //this.clearNewCourse();
        }, 500); // Adjust the delay as needed
      }
    },
    //Methods for addCourse button
    addCourse() {
      this.showAddCourseForm = true
    },
    cancelAddCourse() {
      this.showAddCourseForm = false
      this.clearNewCourse()
    },
    submitCourse() {
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

        this.showSuccessMessage = true

        console.log(this.courses) //test
        setTimeout(() => {
          this.showSuccessMessage = false
          //this.clearNewCourse();
        }, 500) // Adjust the delay as needed
      }
    },
    validateNewCourse() {
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
        this.newCourse.year > 4
      ) {
        this.errors.year = 'Year must be a number between 1 and 4'
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
    clearNewCourse() {
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
    deleteClass(classroomId) {
      if (this.classrooms[classroomId] !== undefined) {
        delete this.classrooms[classroomId];
        console.log(`Classroom ${classroomId} deleted successfully.`);
      } else {
        console.log(`Classroom ${classroomId} not found.`);
      }
    },
    getInstructors() {
      const inst = new Set();
      for (let i = 0; i < this.courses.length; i++) {
        inst.add(this.courses[i].instructor);
      }
      return inst;
    },
    getCourses() {
      const a = [];
      for (let i = 0; i < this.courses.length; i++) {
        a[i] = this.courses[i].code;
      }
      return a;
    },
    addService() {
      this.showAddServiceForm = true
    },
    cancelAddService() {
      this.showAddServiceForm = false
      this.clearNewServiceHour()
    },
    //Methods for addBusyHour button
    addBusyHour() {
      this.showAddBusyForm = true
    },
    cancelAddBusyHour() {
      this.showAddBusyForm = false
      this.clearNewBusyHour()
    },
    submitBusyHour() {
      // Validate the new busy hour
      if (this.validateNewBusyHour()) {
        // Extract input values
        const instructorName = this.newBusyHour.instructor.trim()
        const selectedDay = this.newBusyHour.day
        const selectedHour = this.newBusyHour.hour // Change from hours to hour

        // Process selected hour
        const processedHour = 8 * (parseInt(this.weekdays[selectedDay]) - 1) + parseInt(selectedHour);

        // Check if the instructor is already busy during selected hour
        const busyTimes = this.busy[instructorName] // Move this row outside the loop
        if (busyTimes && busyTimes.includes(processedHour)) {
          // Use processedHour instead of processedHours
          this.errors.busyHour = 'Instructor is already busy at this time'
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
          this.showSuccessMessage = false
          //this.clearNewBusyHour();
        }, 500) // Adjust the delay as needed

        console.log(this.busy)

      }
    },
    validateNewBusyHour() {
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
    validateNewServiceHour() {
      // Reset errors
      this.errors = {}
      // Perform validation for each field
      let isValid = true

      if (!this.newServiceHour.course) {
        this.errors.course = 'Course name is required'
        isValid = false
      }
      if (!this.newServiceHour.day) {
        this.errors.day = 'Day of the week is required'
        isValid = false
      }
      if (!this.newServiceHour.hour) {
        this.errors.hour = 'At least one hour must be selected'
        isValid = false
      }
      console.log(this.newServiceHour.course.block)
      if (this.findCourse(this.newServiceHour.course).block === "2+1") {
        if (!this.newServiceHour.dayAlt ) {
          this.errors.dayAlt = 'Day of the week is required'
          isValid = false
        } else if ((this.newServiceHour.dayAlt === this.newServiceHour.day && (this.newServiceHour.hourAlt === this.newServiceHour.hour || parseInt(this.newServiceHour.hourAlt) === parseInt(this.newServiceHour.hour) + 1 ))
        // or one more of the day and hour between dayAlt and hourAlt

        ){
          this.errors.dayAlt = 'Conflicting hours between 2 hour part and 1 hour part.'
          isValid = false
        }
      }
      if (this.findCourse(this.newServiceHour.course).block === "2+1" ) {
        if ( !this.newServiceHour.hourAlt) {
          this.errors.hourAlt = 'At least one hour must be selected'
          isValid = false
        }
      }

      //if(this.service[this.newServiceHour.course]){
      //  this.errors.service = 'This course already has a service hour assigned to it'
      //  isValid = false
      //}

      return isValid
    },
    clearNewBusyHour() {
      // Clear the new busy hour object
      this.newBusyHour = {
        instructor: '',
        day: '',
        hours: []
      }
      // Reset errors
      this.errors = {}
    },

    clearNewServiceHour() {
      // Clear the new busy hour object
      this.newServiceHour = {
        course: '',
        day: '',
        dayAlt: '',
        hourAlt: '',
        hour: '',
        hours: []
      }
      // Reset errors
      this.errors = {}
    },


    editBusy(instructor) {
      this.editingInstructor = instructor;
      this.newBusyHour.instructor = instructor;
      this.showEditBusyForm = true;
    },


    removeSelectedHour() {
      if (this.newBusyHour.hour2.length > 0) {

        const selectedHours = [...this.newBusyHour.hour2]; // Create a copy of the selected hours to iterate over
        for (let i = 0; i < selectedHours.length; i++) {
          const hourIndex = this.busy[this.editingInstructor].indexOf(selectedHours[i]);
          if (hourIndex !== -1) {
            this.busy[this.editingInstructor].splice(hourIndex, 1);
          }
        }
        if (this.busy[this.editingInstructor].length === 0) {
          delete this.busy[this.editingInstructor]
        }
      } else {
        //alert("Please select hours to remove.");
      }
    },


    cancelEditBusy() {
      this.showEditBusyForm = false;
      this.editingInstructor = null;
      this.clearNewBusyHour();
    },

    editSubmitBusy() {
      // Validate the edited busy hour
      if (this.validateNewBusyHour()) {
        // Extract input values
        const instructorName = this.editingInstructor.trim();
        const selectedDay = this.newBusyHour.day;
        const selectedHour = this.newBusyHour.hour;

        // Process selected hour
        const processedHour = 8 * parseInt(this.weekdays[selectedDay] - 1) + parseInt(selectedHour);

        // Check if the instructor is already busy during selected hour
        const busyTimes = this.busy[instructorName];
        if (busyTimes && busyTimes.includes(processedHour)) {
          this.errors.busyHour = `Instructor is already busy at`;
          return;
        }

        // Add the new busy hour to the busy schedule
        if (!this.busy[instructorName]) {
          this.busy[instructorName] = [];
        }
        this.busy[instructorName].push(processedHour);

        // Show success message
        this.showSuccessMessage = true;

        // Clear the form and hide it after a delay
        setTimeout(() => {
          this.showSuccessMessage = false;
          //this.clearNewBusyHour();
        }, 500);
      }
    },

    editService(course) {

      this.editingService = course;
      this.newServiceHour.course = course;
      this.showEditServiceForm = true;

    },

    cancelEditService() {

      // add service
      this.showEditServiceForm = false;
      this.editingService = null;
      this.clearNewServiceHour()

    },

    submitService() {
      // Validate the new service hour
      if (this.validateNewServiceHour()) {

        // Extract input values
        const selectedCourse = this.newServiceHour.course;
        const selectedDay = this.newServiceHour.day;
        const selectedHour = this.newServiceHour.hour;

        const selectedDay2 = this.newServiceHour.dayAlt;
        const selectedHour2 = this.newServiceHour.hourAlt;

        this.service[selectedCourse] = [] // empty

        // Process selected hour
        const processedHour = 8 * parseInt(this.weekdays[selectedDay] - 1) + parseInt(selectedHour);

        const processedHour2 = 8 * parseInt(this.weekdays[selectedDay2] - 1) + parseInt(selectedHour2);


        // Check if the course already has service hours during the selected hour
        const serviceHours = this.service[selectedCourse];
        if (serviceHours && serviceHours.includes(processedHour) || serviceHours.includes(processedHour2)) {
          this.errors.serviceHour = `Service hour already exists for the course at this time.`;
          return;
        }


        // Add the new service hour to the service schedule
        if (!this.service[selectedCourse]) {
          this.service[selectedCourse] = [];
        }

        // 3 as a placeholder. !!!!!!!!!!!!!!!!!! how to determine blocks which type of service etc?,
        //??

        if (this.findCourse(selectedCourse).block === "3") {
          this.service[selectedCourse].push(processedHour);
          this.service[selectedCourse].push(processedHour + 1);
          this.service[selectedCourse].push(processedHour + 2);
        }

        if (this.findCourse(selectedCourse).block === "2+1") {
          this.service[selectedCourse].push(processedHour);
          this.service[selectedCourse].push(processedHour + 1);
          this.service[selectedCourse].push(processedHour2);

        }


        // Show success message
        this.showSuccessMessage = true;

        // Clear the form and hide it after a delay
        setTimeout(() => {
          this.showSuccessMessage = false;
          //this.clearNewServiceHour();
        }, 500);
      }
    },


    submitEditService() {
      this.submitService();
    },



    //Methods for editCourses button
    editClass(classroomId) {

      this.editingClass = classroomId

      this.newClass.capacity = this.classrooms[this.editingClass]
      this.newClass.classroomId = classroomId

      this.showEditClassForm = true;

    },


    cancelEditClass() {
      this.showEditClassForm = false
      this.editingClass = null;
      this.clearNewClass()
    },


    editSubmitClass() {
      // Validate the edited course

      if (this.validateNewClass()) {
        // Update the course in the list of courses
        this.classrooms[this.editingClass] = this.newClass.capacity;

        // Show success message
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.showSuccessMessage = false;
          //this.clearNewClass();
        }, 500); // Adjust the delay as needed
      }
    },


    //Methods for addClass button
    addClass() {
      this.showAddClassForm = true
    },
    cancelAddClass() {
      this.showAddClassForm = false
      this.clearNewClass()
    },
    submitClass() {
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
          this.showSuccessMessage = false
          //this.clearNewClass()
        }, 500) // Adjust the delay as needed
      }
    },
    validateNewClass() {
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
    clearNewClass() {
      // Clear the new class object
      this.newClass = {
        classroomId: '',
        capacity: ''
      }
      // Reset errors
      this.errors = {}
    },

    // Functions for makeSchedule button
    findCourse(code) {
      const foundCourse = this.courses.find(course => course.code === code)
      if (foundCourse) {
        //console.log('Found course:', foundCourse)
        return foundCourse
      } else {
        //console.log(`Course with code ${code} not found.`)
        return null
      }
    },

    findClassroom(course, hour) {
      let smallestClassroom = null;
      let smallestCapacity = Infinity;

      for (const classroom in this.classrooms) {
        const capacity = this.classrooms[classroom];

        if (capacity >= course.num_students) {
          let isAvailable = true;

          for (let k of [1, 2, 3, 4]) {
            for (let j = 0; j < course.hours; j++) {
              if (this.schedule[k][hour + j] && this.schedule[k][hour + j][1] === classroom) {
                isAvailable = false;
                break;
              }
            }
          }

          if (isAvailable && capacity < smallestCapacity) {
            smallestClassroom = classroom;
            smallestCapacity = capacity;
          }
        }
      }

      return smallestClassroom;
    },


    layService(courses) {
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

    lay(courses, year = 1, hour = 0) {
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

    checkHourAvailable(year, hour, course, block) {
      // You cannot put a 3 hour lesson at the 6. hour of a day (Not enough time)
      if (block === 3) {
        if (hour % 8 === 6 || hour % 8 === 7) return false
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

    toHour(integer) {
      return (integer % 8) + 8 + ':30'
    },

    hourList() {
      const hours = [];
      for (let i = 8; i <= 15; i++) {
        hours.push({ value: i, label: `${i}:30` });
      }
      return hours;
    },

    dayList() {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    },

    convertHoursToText(hoursArray) {
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      let result = '';


      const hoursByWeekday = {};
      hoursArray.forEach(hour => {
        const weekday = Math.floor(hour / 8);
        const time = (hour % 8) + 8;
        if (!hoursByWeekday[weekday]) {
          hoursByWeekday[weekday] = [time];
        } else {
          hoursByWeekday[weekday].push(time);
        }
      });

      for (const weekday in hoursByWeekday) {
        if (hoursByWeekday.hasOwnProperty(weekday)) {
          const times = hoursByWeekday[weekday].map(time => `${time}:30`).join(', ');
          result += `${weekdays[weekday]} ${times}; `;
        }
      }

      // Remove the trailing semicolon and space
      result = result.trim().slice(0, -1);

      return result;
    },


    toHourandDay(integer) {
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const hour = (integer % 8) + 8;
      const day = weekdays[Math.floor(integer / 8)];
      return `${day} ${hour}:30`;
    },


    makeSchedule() {
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

      try {
        this.layService(courses)
        if (this.lay(courses)) {
          console.log(this.schedule);
          this.successWhenLaying = true;
          this.toggleAccordion('schedule');
        } else {
          this.successWhenLaying = "A schedule couldn't be created because of the constraints.";
          this.toggleAccordion('schedule');
          console.log('Failed to create a schedule.');
        }
      } catch (error) {
        this.successWhenLaying = "Error while creating schedule.";
        this.toggleAccordion('schedule');
        console.log('Failed to create a schedule.');
      }



    }


  },

  //Runs upon mounting
  mounted() {
    //Empty for now
  },

  //Runs upon creation
  created() {
    this.loadCourses()
    this.loadClassrooms()
    this.loadBusy()
    this.loadService()
  }
})

app.mount('#app')
