


import { CommonModule } from '@angular/common';
import { SimulatorLessonsComponent } from './lessons/simulatorLessons/simulatorLessons.component';
import { ViewSimulatorLessonModalComponent } from './lessons/simulatorLessons/view-simulatorLesson-modal.component';
import { CreateOrEditSimulatorLessonModalComponent } from './lessons/simulatorLessons/create-or-edit-simulatorLesson-modal.component';
import { SimulatorLessonPersonLookupTableModalComponent } from './lessons/simulatorLessons/simulatorLesson-person-lookup-table-modal.component';
import { SimulatorLessonSimulatorLookupTableModalComponent } from './lessons/simulatorLessons/simulatorLesson-simulator-lookup-table-modal.component';

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StudentInvoicesComponent } from './sales/studentInvoices/studentInvoices.component';
import { ViewStudentInvoiceModalComponent } from './sales/studentInvoices/view-studentInvoice-modal.component';
import { CreateStudentInvoiceComponent } from './sales/studentInvoices/create-studentInvoice.component';

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
import { NumericTextBoxModule } from '@syncfusion/ej2-angular-inputs';

import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { CreateOrEditEventModalComponent } from './scheduler/create-or-edit-event-modal.component';
import { EditStudentsTheoryLessonModalComponent } from './lessons/theoryLessons/edit-students-theoryLesson-modal.component';
import { InvoiceStudentLookupTableModalComponent } from './sales/studentInvoices/invoice-student-lookup-table-modal.component';
import { InvoiceProductLookupTableModalComponent } from './sales/studentInvoices/invoice-product-lookup-table-modal.component';
import { DLLicenseClassLookupTableModalComponent } from '@app/shared/common/lookup/drivingLesson-licenseClass-lookup-table-modal.component';
import { PricePackageLookupTableModalComponent } from './students/students/pricePackage-lookup-table-modal.component';
import { StudentsOverviewComponent } from './students/students/students-overview.component';
import { StudentsOverviewOverviewComponent } from './students/students/students-overview-overview.component';
import { StudentsOverviewPricePackageComponent } from './students/students/students-overview-pricePackage.component';
import { StudentsOverviewInvoicesComponent } from './students/students/students-overview-invoices.component';

import { InstructorLookupTableModalComponent } from '@app/shared/common/lookup/instructor-lookup-table-modal.component';
import { CreateOrEditStudentUserModalComponent } from './students/students/create-or-edit-student-user-modal.component';
import { SVPlannedDrivingLessonsComponent } from './studentsView/plannedDrivingLessons/sv-planned-drivingLessons.component';
import { VehicleLookupTableModalComponent } from '@app/shared/common/lookup/vehicle-lookup-table-modal.component';
import { StudentLookupTableModalComponent } from '@app/shared/common/lookup/student-lookup-table-modal.component';

import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { SVDrivingLessonsOverviewComponent } from './studentsView/drivingLessonsOverview/sv-drivingLessons-overview.component';
import { SVBookDrivingLessonComponent } from './studentsView/bookDrivingLesson/sv-book-drivingLesson.component';
import { PersonalSchedulerComponent } from './personalScheduler/personalScheduler.component';
import { StudentsOverviewFormsComponent } from './students/students/students-overview-forms.component';
import { SVBookDrivingLessonLookupSchedulerModalComponent } from './studentsView/bookDrivingLesson/sv-book-drivingLesson-lookup-scheduler-modal.component';


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
      ReactiveFormsModule,
      ModalModule,
      TabsModule.forRoot(),
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
      NumericTextBoxModule,
      TimepickerModule.forRoot(),
      ButtonsModule.forRoot()
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
      DashboardComponent,
      DLStudentLookupTableModalComponent,
      TLStudentLookupTableModalComponent,
      SchedulerComponent,
      CreateEventTypeModalComponent,
      CreateOrEditEventModalComponent,
      EditStudentsTheoryLessonModalComponent,
      StudentInvoicesComponent,
      ViewStudentInvoiceModalComponent,
      CreateStudentInvoiceComponent,
      InvoiceStudentLookupTableModalComponent,
      InvoiceProductLookupTableModalComponent,
      DLLicenseClassLookupTableModalComponent,
      PricePackageLookupTableModalComponent,
      StudentsOverviewComponent,
      StudentsOverviewOverviewComponent,
      StudentsOverviewPricePackageComponent,
      StudentsOverviewInvoicesComponent,
      StudentsOverviewFormsComponent,
      InstructorLookupTableModalComponent,
      CreateOrEditStudentUserModalComponent,
      SVPlannedDrivingLessonsComponent,
      VehicleLookupTableModalComponent,
      StudentLookupTableModalComponent,
      SVDrivingLessonsOverviewComponent,
      SVBookDrivingLessonComponent,
      PersonalSchedulerComponent,
      SVBookDrivingLessonLookupSchedulerModalComponent,
      SimulatorLessonsComponent,
      ViewSimulatorLessonModalComponent,		
      CreateOrEditSimulatorLessonModalComponent,
      SimulatorLessonPersonLookupTableModalComponent,
      SimulatorLessonSimulatorLookupTableModalComponent,
    ],
    providers: [
        { provide: BsDatepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerConfig },
        { provide: BsDaterangepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDaterangepickerConfig },
        { provide: BsLocaleService, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerLocale }
    ]
})
export class MainModule { }
