let courses = [];

let counter = 0;

let busy = {};

let schedule = {
    1: new Array(40).fill(null),
    2: new Array(40).fill(null),
    3: new Array(40).fill(null),
    4: new Array(40).fill(null)
};

let classrooms = {

    "C501": 60,
    "C408": 52,
    "B403": 100,
    "B503": 160,
    // has to be sorted small to big!!!

};

class Course {
    constructor(code, name, year, credit, type, dept, num_students, instructor, block) {
        this.code = code;
        this.year = year;
        this.num_students = num_students;
        this.instructor = instructor;
        this.block = block;
        this.hours = 0;
    }
}

function parseRowToCourse(row) {
    const [code, name, year, credit, type, dept, num_students, instructor, block] = row.trim().split(',');
    return new Course(code, name, parseInt(year), parseInt(credit), type, dept, parseInt(num_students), instructor, block);
}

function readCoursesFromString(data) {
    for (const row of data.split('\n')) {
        const course = parseRowToCourse(row);
        if (course.block === "2+1") {
            course.hours = 1;
            // creates duplicate
            courses.push(JSON.parse(JSON.stringify(course)));
            course.hours = 2;
            courses.push(course);
            // Add two lessons with same attributes but different hour.
        } else {
            course.hours = 3;
            courses.push(course);
        }
    }
    return courses;
}

function findCourseByCode(code) {
    return courses.find(course => course.code === code);
}

function findClassroom(course, hour) {

    // Finds smallest class suitable then returns it.
    let classroom = null;

    for (const m in classrooms) {
        if (classrooms[m] > course.num_students) {

            var flag = false;

            // Is the classroom assigned to any other class in this hour?
            // Maybe won't always work.
            for (let k of [1, 2, 3, 4]) {

                // Check for the every hour in block.
                for (let j = 0; j < course.hours; j++) {
                    if (schedule[k][hour + j] && schedule[k][hour + j][1] !== null) {
                        if (schedule[k][hour + j][1] === m) {
                            flag = true;
                            break;
                        }
                    }
                }
            }

            if (!flag) {
                classroom = m;
                break;
            }
        }
    }
    return classroom;
    
}

function readServiceTimes(data) {

    for (const line of data.split('\n')) {

        const [courseCode, day, timeSlots] = line.trim().split(',', 3);
        const slots = timeSlots.replace(/"/g, '').split(',');
        const course = findCourseByCode(courseCode);
        const hour = parseInt(slots[0].split(":")[0]) - 8 + 8 * {
            "Monday": 0,
            "Tuesday": 1,
            "Wednesday": 2,
            "Thursday": 3,
            "Friday": 4
        }[day];

        let classroom = findClassroom(course,hour);

        if (classroom === null) {
            throw new Error("Can't find a classroom: " + course.code);
        }

        if (checkHourAvailable(course.year, hour, course, course.hour)) {
            schedule[course.year].fill([course, classroom], hour, hour + course.hours);
        } else {
            // hatalar
        }

        courses.splice(courses.findIndex(c => c.code === courseCode), 1);
    }
}

function readBusy(data) {
    for (let line of data.split('\n')) {
        let [instructor, day] = line.trim().split(',', 2);
        let timeSlots = line.trim().split('"')[1]
        let slots = timeSlots.replace(/"/g, '').split(',');

        const times = [];
        for (const slot of slots) {
            const hour = parseInt(slot.split(":")[0]) - 8 + 8 * {
                "Monday": 0,
                "Tuesday": 1,
                "Wednesday": 2,
                "Thursday": 3,
                "Friday": 4
            }[day];
            times.push(hour);
        }
        if (busy[instructor] !== undefined) {
            busy[instructor].push(...times);
        } else {
            busy[instructor] = times;
        }
    }
}

function lay(year = 1, hour = 0) {

    counter++;
    if (hour >= 40) {
        return lay(year + 1, 0);
    }
 
    if (year > 4) {
        return courses.length === 0;
    }

    // Try every course if it ever fits.
    for (let i = 0; i < courses.length; i++) {
      
        const course = courses[i];

        if (course.year !== year) {
            // Is the course for this year?
            continue;
        }

        let classroom = findClassroom(course, hour);

        if (checkHourAvailable(year, hour, course, course.hours) && classroom) {
            schedule[year].fill([course, classroom], hour, hour + course.hours);
            counter++;
            courses.splice(i, 1);
            

            // Recursive call
            if (lay(year, hour + course.hours)) {
              
                return true;
            } else {
                // Failed: backtracking.
                schedule[year].fill(null, hour, hour + course.hours);
                courses.push(course);
                counter++;
                return false;
            }
        } 
    }
    return lay(year, hour + 1); 
}


function checkHourAvailable(year, hour, course, block) {
    
    // 6.saate 3 saatlik ders koyulamaz.
    if (block === 3) {
        if ((hour % 8) === 6 || (hour % 7) === 0)
            return false
    }

    // 7.saate 2 saatlik ders koyulamaz.
    if (block === 2) {
        if ((hour % 8) === 7)
            return false
    }

    // Same lesson can't be in same day multiple times
    for (let z = hour - (hour % 8); z < hour - (hour % 8) + block; z++) {
        if (schedule[year][z] !== null && course.code === schedule[year][z][0].code) {
            return false;
        }
    }

    for (let j = 0; j < block; j++) {

        // Every hour of the block to be empty
        if (schedule[year][hour + j] !== null) {
            return false;
        }

        // ıs it busy hour for the instructor?
        if (busy[course.instructor] !== undefined && busy[course.instructor].includes(hour + j)) {
            return false;
        }

        // Instructor can only have one lecture at a time.
        for (let i = 1; i <= 4; i++) {
            if (schedule[i][hour + j] !== null && schedule[i][hour + j][0].instructor === course.instructor) {
                return false;
            }
        }
    }

    return true;
}

const coursesCsv = `CENG114,Computer Programming II,1,5,C,D,95,OGR.GOR. YUSUF EVREN AYKAC,3
CHEM101,GENERAL CHEMISTRY,1,5,C,S,110,DOC.DR. NURAY CELEBI,3
MATH104,Applied Linear Algebra,1,5,C,D,103,DOC.DR. MUHAMMED ABDULLAH BULBUL,3
MATH102,CALCULUS II,1,6,C,S,116,DR. OGR. UYESI SELIM BAHADIR,3
MATH106,PROBABILITY AND STATISTICS,1,6,C,S,79,DR. OGR. UYESI OSMAN SERDAR GEDIK,3
PHYS102,PHYSICS II,1,6,C,S,113,PROF.DR. ABDULLAH YILDIZ,3
TDL102,TURK DILI II,1,1,C,S,72,DOC.DR. MUSTAFA ARSLAN,3
TIT101,TURK INKILAP TARIHI I,1,1,C,S,101,DR. OGR. UYESI TEKIN ONAL,3
CENG202,Data Structures,2,5,C,D,99,DR. OGR. UYESI SHAFQAT UR REHMAN,3
CENG204,Computer System Architecture,2,5,C,D,86,DR. OGR. UYESI TAREK NAJJAR,3
CENG206,Programming Languages,2,5,C,D,135,DR. OGR. UYESI FAHREDDIN SUKRU TORUN,2+1
ENGR202,ENGINEERING MATHEMATICS II,2,6,C,S,104,DR. OGR. UYESI SELIM BAHADIR,3
ENGR254,PRINCIPLES OF BODY MOVEMENT,2,3,E,S,50,DR. OGR. UYESI OZKAN KILIC,3
CENG302,Formal Languages and Automata Theory,3,5,C,D,86,DR. OGR. UYESI FADI YILMAZ,2+1
CENG304,Computer Networks,3,5,C,D,93,DR. OGR. UYESI MUSTAFA YENIAD,3
CENG306,Software Engineering,3,5,C,D,109,DOC.DR. FATIH NAR,3
CENG310,Human Computer Interaction,3,5,E,D,30,DOC.DR. MUHAMMED ABDULLAH BULBUL,3
CENG311,WEB TECHNOLOGY APPLICATIONS,3,5,E,D,50,DR. OGR. UYESI FADI YILMAZ,3
CENG342,Parallel Programming I,3,5,E,D,45,DR. OGR. UYESI FAHREDDIN SUKRU TORUN,2+1
CENG404,Special Topics in CENG II,4,5,E,D,25,DR. OGR. UYESI SHAFQAT UR REHMAN,3
CENG415,Applications of Computer Graphics,4,5,E,D,25,DOC.DR. MUHAMMED ABDULLAH BULBUL,2+1
CENG424,COMPUTER SIMULATION AND MODELLING,4,5,E,D,30,DR. OGR. UYESI TAREK NAJJAR,3
CENG427,Programming of Mobile Devices,4,5,E,D,33,AR. GOR. DR. IBRAHIM ATLI,3
CENG428,NEURAL NETWORKS,4,5,E,D,25,DOC.DR. FATIH NAR,2+1
CENG431,INTRODUCTION TO DESING PATTERNS,4,5,E,D,25,OGR.GOR. YUSUF EVREN AYKAC,3
CENG451,Principles of Cyber Physical Systems,4,5,E,D,25,PROF.DR. REMZI YILDIRIM,3
CENG462,GAME PROGRAMMING PIPELINE,4,5,E,D,25,OGR.GOR. YUSUF EVREN AYKAC,3
CENG465,INTERNET OF THINGS AND ITS APPLICATIONS,4,5,E,D,25,PROF.DR. REMZI YILDIRIM,3
CENG474,COMMUNICATION AND NETWORK SECURITY,4,5,E,D,25,DR. OGR. UYESI FADI YILMAZ,3`;

const busyCsv = `OGR.GOR. YUSUF EVREN AYKAC,Monday,"8:30,9:30"
OGR.GOR. YUSUF EVREN AYKAC,Monday,"11:30,12:30"
OGR.GOR. YUSUF EVREN AYKAC,Tuesday,"8:30,9:30,11:30,12:30,15:30"
DOC.DR. NURAY CELEBI,Monday,"8:30,9:30;12:30,13:30,14:30"
DOC.DR. NURAY CELEBI,Tuesday,"8:30,9:30"
DOC.DR. NURAY CELEBI,Friday,"12:30,13:30,14:30"
DR. OGR. UYESI TAREK NAJJAR,Monday,"8:30,9:30"
DR. OGR. UYESI TAREK NAJJAR,Monday,"8:30,9:30,10:30,11:30,12:30,13:30,14:30,15:30,16:30"`;

const serviceCsv = `CHEM101,Tuesday,"8:30,9:30,10:30"
MATH102,Monday,"13:30,14:30,15:30"
MATH106,Thursday,"13:30,14:30,15:30"
PHYS102,Friday,"8:30,9:30,10:30"
TDL102,Wednesday,"13:30,14:30,15:30"
TIT101,Wednesday,"8:30,9:30,10:30"
ENGR202,Friday,"12:30,13:30,14:30"
ENGR254,Tuesday,"13:30,14:30,15:30"`;

function displayScheduleAsHTML(schedule) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create table headers
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Hour</th>';
    for (let year = 1; year <= 4; year++) {
        const th = document.createElement('th');
        th.textContent = `Year ${year}`;
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    for (let hour = 0; hour < 40; hour++) { // Adjusted loop range to cover all hours of the week
        const row = document.createElement('tr');
        const dayIndex = Math.floor(hour / 8); // Calculate dayIndex based on hour
        const hourLabel = `${days[dayIndex]} ${hour % 8 + 8}:30`;

        // Create hour cell
        const hourCell = document.createElement('td');
        hourCell.textContent = hourLabel;
        row.appendChild(hourCell);

        // Create cells for each year
        for (let year = 1; year <= 4; year++) {
            const course = schedule[year][hour];
            const cell = document.createElement('td');
            if (course) {
                const courseCode = course[0].code;
                const instructor = course[0].instructor.split(` `).slice(-1)[0];
                cell.textContent = `${courseCode} ${course[1]} ${instructor}`;
            }
            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    document.body.appendChild(table);
}

courses = readCoursesFromString(coursesCsv);
readServiceTimes(serviceCsv);
readBusy(busyCsv);

if (lay()) {
    displayScheduleAsHTML(schedule);
} else {
    console.log("Failed");
}

// Example usage:

console.log(counter)