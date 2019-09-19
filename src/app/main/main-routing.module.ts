import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StudentInvoicesComponent } from './sales/studentInvoices/studentInvoices.component';
import { DrivingLessonsComponent } from './lessons/drivingLessons/drivingLessons.component';
import { StudentsComponent } from './students/students/students.component';
import { TheoryLessonsComponent } from './lessons/theoryLessons/theoryLessons.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import {SchedulerComponent } from './scheduler/scheduler.component';

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
                    { path: 'scheduler', component: SchedulerComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class MainRoutingModule { }
