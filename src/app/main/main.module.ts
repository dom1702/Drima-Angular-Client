import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { TheoryLessonsComponent } from './lessons/theoryLessons/theoryLessons.component';
import { ViewTheoryLessonModalComponent } from './lessons/theoryLessons/view-theoryLesson-modal.component';
import { CreateOrEditTheoryLessonModalComponent } from './lessons/theoryLessons/create-or-edit-theoryLesson-modal.component';

import { StudentsComponent } from './students/students/students.component';
import { ViewStudentModalComponent } from './students/students/view-student-modal.component';
import { CreateOrEditStudentModalComponent } from './students/students/create-or-edit-student-modal.component';

import { DrivingLessonTopicLookupTableModalComponent } from './lessons/drivingLessons/drivingLessonTopic-lookup-table-modal.component';

import { DrivingLessonsComponent } from './lessons/drivingLessons/drivingLessons.component';
import { ViewDrivingLessonModalComponent } from './lessons/drivingLessons/view-drivingLesson-modal.component';
import { CreateOrEditDrivingLessonModalComponent } from './lessons/drivingLessons/create-or-edit-drivingLesson-modal.component';
import { CreateEventTypeModalComponent } from './scheduler/create-event-type-modal.component';

import { LicenseClassLookupTableModalComponent } from '../shared/common/lookup/licenseClass-lookup-table-modal.component';

import { AutoCompleteModule } from 'primeng/primeng';
import { PaginatorModule } from 'primeng/primeng';
import { EditorModule } from 'primeng/primeng';
import { InputMaskModule } from 'primeng/primeng';import { FileUploadModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';

import { UtilsModule } from '@shared/utils/utils.module';
import { CountoModule } from 'angular2-counto';
import { ModalModule, TabsModule, TooltipModule, BsDropdownModule, PopoverModule } from 'ngx-bootstrap';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MainRoutingModule } from './main-routing.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { BsDatepickerModule, BsDatepickerConfig, BsDaterangepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { NgxBootstrapDatePickerConfigService } from 'assets/ngx-bootstrap/ngx-bootstrap-datepicker-config.service';

import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { DLStudentLookupTableModalComponent } from './lessons/drivingLessons/drivingLesson-student-lookup-table-modal.component';
import { TLStudentLookupTableModalComponent } from './lessons/theoryLessons/theoryLesson-student-lookup-table-modal.component';
import { ScheduleAllModule } from '@syncfusion/ej2-angular-schedule';
import { SchedulerComponent } from './scheduler/scheduler.component';

import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { CreateOrEditEventModalComponent } from './scheduler/create-or-edit-event-modal.component';
import { EditStudentsTheoryLessonModalComponent } from './lessons/theoryLessons/edit-students-theoryLesson-modal.component';

NgxBootstrapDatePickerConfigService.registerNgxBootstrapDatePickerLocales();

@NgModule({
    imports: 
    [
      FileUploadModule,
      AutoCompleteModule,
      PaginatorModule,
      EditorModule,
      InputMaskModule,		
      TableModule,
      CommonModule,
      FormsModule,
      ModalModule,
      TabsModule,
      TooltipModule,
      AppCommonModule,
      UtilsModule,
      MainRoutingModule,
      CountoModule,
      NgxChartsModule,
      BsDatepickerModule.forRoot(),
      BsDropdownModule.forRoot(),
      PopoverModule.forRoot(),
      NgMultiSelectDropDownModule.forRoot(),
      ScheduleAllModule,
      TimepickerModule.forRoot()
    ],
    declarations: 
    [
      TheoryLessonsComponent,
      ViewTheoryLessonModalComponent,		
      CreateOrEditTheoryLessonModalComponent,
      StudentsComponent,
      ViewStudentModalComponent,		
      CreateOrEditStudentModalComponent,
      DrivingLessonsComponent,
      ViewDrivingLessonModalComponent,		
      CreateOrEditDrivingLessonModalComponent,
      DrivingLessonTopicLookupTableModalComponent,
      LicenseClassLookupTableModalComponent,
      DashboardComponent,
      DLStudentLookupTableModalComponent,
      TLStudentLookupTableModalComponent,
      SchedulerComponent,
      CreateEventTypeModalComponent,
      CreateOrEditEventModalComponent,
      EditStudentsTheoryLessonModalComponent
    ],
    providers: [
        { provide: BsDatepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerConfig },
        { provide: BsDaterangepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDaterangepickerConfig },
        { provide: BsLocaleService, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerLocale }
    ]
})
export class MainModule { }
