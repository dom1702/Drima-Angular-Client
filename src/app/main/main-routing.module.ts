import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoursesComponent } from './courses/courses/courses.component';
import { SimulatorLessonsComponent } from './lessons/simulatorLessons/simulatorLessons.component';
import { StudentInvoicesComponent } from './sales/studentInvoices/studentInvoices.component';
import { DrivingLessonsComponent } from './lessons/drivingLessons/drivingLessons.component';
import { StudentsComponent } from './students/students/students.component';
import { TheoryLessonsComponent } from './lessons/theoryLessons/theoryLessons.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import {SchedulerComponent } from './scheduler/scheduler.component';
import { CreateStudentInvoiceComponent } from './sales/studentInvoices/create-studentInvoice.component';
import { StudentsOverviewComponent } from './students/students/students-overview.component';
import { SVPlannedDrivingLessonsComponent } from './studentsView/plannedDrivingLessons/sv-planned-drivingLessons.component';
import { SVDrivingLessonsOverviewComponent } from './studentsView/drivingLessonsOverview/sv-drivingLessons-overview.component';
import { SVBookDrivingLessonComponent } from './studentsView/bookDrivingLesson/sv-book-drivingLesson.component';
import { PersonalSchedulerComponent } from './personalScheduler/personalScheduler.component';
import { SVFrequentlyAskedQuestionsComponent } from './studentsView/frequentlyAskedQuestions/sv-frequently-asked-questions.component';
import { SVTheoryCourseComponent } from './studentsView/theoryCourse/sv-theory-course.component';
import { SVQuizComponent } from './studentsView/theoryCourse/sv-quiz.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                children: [
                    { path: 'courses/courses', component: CoursesComponent, data: { permission: 'Pages.Courses' }  },
                    { path: 'lessons/simulatorLessons', component: SimulatorLessonsComponent, data: { permission: 'Pages.SimulatorLessons' }  },
                    { path: 'sales/studentInvoices', component: StudentInvoicesComponent, data: { permission: 'Pages.StudentInvoices' }  },
                    { path: 'lessons/drivingLessons', component: DrivingLessonsComponent, data: { permission: 'Pages.DrivingLessons' }  },
                    { path: 'students/students', component: StudentsComponent, data: { permission: 'Pages.Students' }  },
                    { path: 'lessons/theoryLessons', component: TheoryLessonsComponent, data: { permission: 'Pages.TheoryLessons' }  },
                    { path: 'dashboard', component: DashboardComponent, data: { permission: 'Pages.Tenant.Dashboard' } },
                    { path: 'scheduler', component: SchedulerComponent, data: { permission: 'Pages.Scheduler' } },
                    { path: 'personalScheduler', component: PersonalSchedulerComponent, data: { permission: 'Pages.PersonalScheduler' } },
                    { path: 'sales/studentInvoices/create-studentInvoice', component: CreateStudentInvoiceComponent, data: { permission: 'Pages.StudentInvoices.Create' }},
                    { path: 'students/students/students-overview', component: StudentsOverviewComponent },
                    { path: 'studentsView/plannedDrivingLessons', component: SVPlannedDrivingLessonsComponent, data: { permission: 'StudentView' } },
                    { path: 'studentsView/drivingLessonsOverview', component: SVDrivingLessonsOverviewComponent, data: { permission: 'StudentView' }},
                    { path: 'studentsView/bookDrivingLesson', component: SVBookDrivingLessonComponent, data: { permission: 'StudentView' }},
                    { path: 'studentsView/frequentlyAskedQuestions', component: SVFrequentlyAskedQuestionsComponent, data: { permission: 'StudentView' }},
                    { path: 'studentsView/theoryCourse', component: SVTheoryCourseComponent, data: { permission: 'StudentView' }},
                    { path: 'studentsView/theoryCourse/quiz', component: SVQuizComponent, data: { permission: 'StudentView' }}
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class MainRoutingModule { }
