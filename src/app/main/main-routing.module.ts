import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StudentInvoicesComponent } from './sales/studentInvoices/studentInvoices.component';
import { DrivingLessonsComponent } from './lessons/drivingLessons/drivingLessons.component';
import { StudentsComponent } from './students/students/students.component';
import { TheoryLessonsComponent } from './lessons/theoryLessons/theoryLessons.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import {SchedulerComponent } from './scheduler/scheduler.component';
import { CreateStudentInvoiceComponent } from './sales/studentInvoices/create-studentInvoice.component';
import { StudentsOverviewComponent } from './students/students/students-overview.component';
import { SVPlannedDrivingLessonsComponent } from './studentsView/plannedDrivingLessons/sv-planned-drivingLessons.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                children: [
                    { path: 'sales/studentInvoices', component: StudentInvoicesComponent, data: { permission: 'Pages.StudentInvoices' }  },
                    { path: 'lessons/drivingLessons', component: DrivingLessonsComponent, data: { permission: 'Pages.DrivingLessons' }  },
                    { path: 'students/students', component: StudentsComponent, data: { permission: 'Pages.Students' }  },
                    { path: 'lessons/theoryLessons', component: TheoryLessonsComponent, data: { permission: 'Pages.TheoryLessons' }  },
                    { path: 'dashboard', component: DashboardComponent, data: { permission: 'Pages.Tenant.Dashboard' } },
                    { path: 'scheduler', component: SchedulerComponent },
                    { path: 'sales/studentInvoices/create-studentInvoice', component: CreateStudentInvoiceComponent},
                    { path: 'students/students/students-overview', component: StudentsOverviewComponent },
                    { path: 'studentsView/plannedDrivingLessons', component: SVPlannedDrivingLessonsComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class MainRoutingModule { }
