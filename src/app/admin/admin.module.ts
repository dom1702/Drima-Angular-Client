﻿import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { PredefinedTheoryLessonsComponent } from './lessons/predefinedTheoryLessons/predefinedTheoryLessons.component';
import { ViewPredefinedTheoryLessonModalComponent } from './lessons/predefinedTheoryLessons/view-predefinedTheoryLesson-modal.component';
import { CreateOrEditPredefinedTheoryLessonModalComponent } from './lessons/predefinedTheoryLessons/create-or-edit-predefinedTheoryLesson-modal.component';

import { PredefinedDrivingLessonsComponent } from './lessons/predefinedDrivingLessons/predefinedDrivingLessons.component';
import { ViewPredefinedDrivingLessonModalComponent } from './lessons/predefinedDrivingLessons/view-predefinedDrivingLesson-modal.component';
import { CreateOrEditPredefinedDrivingLessonModalComponent } from './lessons/predefinedDrivingLessons/create-or-edit-predefinedDrivingLesson-modal.component';

import { FormsComponent } from './forms/forms/forms.component';

import { PricePackagesComponent } from './sales/pricePackages/pricePackages.component';

import { ProductsComponent } from './sales/products/products.component';

import { CreateOrEditProductModalComponent } from './sales/products/create-or-edit-product-modal.component';

import { SimulatorsComponent } from './resources/simulators/simulators.component';
import { ViewSimulatorModalComponent } from './resources/simulators/view-simulator-modal.component';
import { CreateOrEditSimulatorModalComponent } from './resources/simulators/create-or-edit-simulator-modal.component';
import { SimulatorOfficeLookupTableModalComponent } from './resources/simulators/simulator-office-lookup-table-modal.component';

import { OfficesComponent } from './resources/offices/offices.component';
import { ViewOfficeModalComponent } from './resources/offices/view-office-modal.component';
import { CreateOrEditOfficeModalComponent } from './resources/offices/create-or-edit-office-modal.component';

import { VehiclesComponent } from './resources/vehicles/vehicles.component';
import { ViewVehicleModalComponent } from './resources/vehicles/view-vehicle-modal.component';
import { CreateOrEditVehicleModalComponent } from './resources/vehicles/create-or-edit-vehicle-modal.component';
import { VehicleLicenseClassLookupTableModalComponent } from './resources/vehicles/vehicle-licenseClass-lookup-table-modal.component';

import { DrivingLessonTopicsComponent } from './templates/drivingLessonTopics/drivingLessonTopics.component';
import { ViewDrivingLessonTopicModalComponent } from './templates/drivingLessonTopics/view-drivingLessonTopic-modal.component';
import { CreateOrEditDrivingLessonTopicModalComponent } from './templates/drivingLessonTopics/create-or-edit-drivingLessonTopic-modal.component';

import { InstructorsComponent } from './instructors/instructors/instructors.component';
import { ViewInstructorModalComponent } from './instructors/instructors/view-instructor-modal.component';
import { CreateOrEditInstructorModalComponent } from './instructors/instructors/create-or-edit-instructor-modal.component';
import { LicenseClassLookupTableModalComponent } from './instructors/instructors/licenseClass-lookup-table-modal.component';

import { TheoryLessonTopicsComponent } from './templates/theoryLessonTopics/theoryLessonTopics.component';
import { ViewTheoryLessonTopicModalComponent } from './templates/theoryLessonTopics/view-theoryLessonTopic-modal.component';
import { CreateOrEditTheoryLessonTopicModalComponent } from './templates/theoryLessonTopics/create-or-edit-theoryLessonTopic-modal.component';

import { LicenseClassesComponent } from './templates/licenseClasses/licenseClasses.component';
import { ViewLicenseClassModalComponent } from './templates/licenseClasses/view-licenseClass-modal.component';
import { CreateOrEditLicenseClassModalComponent } from './templates/licenseClasses/create-or-edit-licenseClass-modal.component';

import { UtilsModule } from '@shared/utils/utils.module';
import { AddMemberModalComponent } from 'app/admin/organization-units/add-member-modal.component';
import { AddRoleModalComponent } from 'app/admin/organization-units/add-role-modal.component';
import { FileUploadModule } from 'ng2-file-upload';
import { ModalModule, PopoverModule, TabsModule, TooltipModule, BsDropdownModule } from 'ngx-bootstrap';
import { BsDatepickerModule, BsDatepickerConfig, BsDaterangepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { AutoCompleteModule, EditorModule, FileUploadModule as PrimeNgFileUploadModule, InputMaskModule, PaginatorModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';
import { TreeModule } from 'primeng/tree';
import { DragDropModule } from 'primeng/dragdrop';
import { TreeDragDropService } from 'primeng/api';
import { ContextMenuModule } from 'primeng/contextmenu';
import { AdminRoutingModule } from './admin-routing.module';
import { AuditLogDetailModalComponent } from './audit-logs/audit-log-detail-modal.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { HostDashboardComponent } from './dashboard/host-dashboard.component';
import { DemoUiComponentsComponent } from './demo-ui-components/demo-ui-components.component';
import { DemoUiDateTimeComponent } from './demo-ui-components/demo-ui-date-time.component';
import { DemoUiEditorComponent } from './demo-ui-components/demo-ui-editor.component';
import { DemoUiFileUploadComponent } from './demo-ui-components/demo-ui-file-upload.component';
import { DemoUiInputMaskComponent } from './demo-ui-components/demo-ui-input-mask.component';
import { DemoUiSelectionComponent } from './demo-ui-components/demo-ui-selection.component';
import { CreateEditionModalComponent } from './editions/create-edition-modal.component';
import { EditEditionModalComponent } from './editions/edit-edition-modal.component';
import { MoveTenantsToAnotherEditionModalComponent } from './editions/move-tenants-to-another-edition-modal.component';
import { EditionsComponent } from './editions/editions.component';
import { InstallComponent } from './install/install.component';
import { CreateOrEditLanguageModalComponent } from './languages/create-or-edit-language-modal.component';
import { EditTextModalComponent } from './languages/edit-text-modal.component';
import { LanguageTextsComponent } from './languages/language-texts.component';
import { LanguagesComponent } from './languages/languages.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { CreateOrEditUnitModalComponent } from './organization-units/create-or-edit-unit-modal.component';
import { OrganizationTreeComponent } from './organization-units/organization-tree.component';
import { OrganizationUnitMembersComponent } from './organization-units/organization-unit-members.component';
import { OrganizationUnitRolesComponent } from './organization-units/organization-unit-roles.component';
import { OrganizationUnitsComponent } from './organization-units/organization-units.component';
import { CreateOrEditRoleModalComponent } from './roles/create-or-edit-role-modal.component';
import { RolesComponent } from './roles/roles.component';
import { HostSettingsComponent } from './settings/host-settings.component';
import { TenantSettingsComponent } from './settings/tenant-settings.component';
import { EditionComboComponent } from './shared/edition-combo.component';
import { FeatureTreeComponent } from './shared/feature-tree.component';
import { OrganizationUnitsTreeComponent } from './shared/organization-unit-tree.component';
import { PermissionComboComponent } from './shared/permission-combo.component';
import { PermissionTreeComponent } from './shared/permission-tree.component';
import { RoleComboComponent } from './shared/role-combo.component';
import { InvoiceComponent } from './subscription-management/invoice/invoice.component';
import { SubscriptionManagementComponent } from './subscription-management/subscription-management.component';
import { CreateTenantModalComponent } from './tenants/create-tenant-modal.component';
import { EditTenantModalComponent } from './tenants/edit-tenant-modal.component';
import { TenantFeaturesModalComponent } from './tenants/tenant-features-modal.component';
import { TenantsComponent } from './tenants/tenants.component';
import { UiCustomizationComponent } from './ui-customization/ui-customization.component';
import { DefaultThemeUiSettingsComponent } from './ui-customization/default-theme-ui-settings.component';
import { Theme2ThemeUiSettingsComponent } from './ui-customization/theme2-theme-ui-settings.component';
import { Theme3ThemeUiSettingsComponent } from './ui-customization/theme3-theme-ui-settings.component';
import { Theme4ThemeUiSettingsComponent } from './ui-customization/theme4-theme-ui-settings.component';
import { Theme5ThemeUiSettingsComponent } from './ui-customization/theme5-theme-ui-settings.component';
import { Theme6ThemeUiSettingsComponent } from './ui-customization/theme6-theme-ui-settings.component';
import { Theme7ThemeUiSettingsComponent } from './ui-customization/theme7-theme-ui-settings.component';
import { Theme8ThemeUiSettingsComponent } from './ui-customization/theme8-theme-ui-settings.component';
import { Theme9ThemeUiSettingsComponent } from './ui-customization/theme9-theme-ui-settings.component';
import { Theme10ThemeUiSettingsComponent } from './ui-customization/theme10-theme-ui-settings.component';
import { Theme11ThemeUiSettingsComponent } from './ui-customization/theme11-theme-ui-settings.component';
import { Theme12ThemeUiSettingsComponent } from './ui-customization/theme12-theme-ui-settings.component';
import { CreateOrEditUserModalComponent } from './users/create-or-edit-user-modal.component';
import { EditUserPermissionsModalComponent } from './users/edit-user-permissions-modal.component';
import { ImpersonationService } from './users/impersonation.service';
import { UsersComponent } from './users/users.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CountoModule } from 'angular2-counto';
import { TextMaskModule } from 'angular2-text-mask';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxBootstrapDatePickerConfigService } from 'assets/ngx-bootstrap/ngx-bootstrap-datepicker-config.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { VehicleInstructorLookupTableModalComponent } from './resources/vehicles/vehicle-instructor-lookup-table-modal.component';
import { OfficeLookupTableModalComponent } from './instructors/instructors/office-lookup-table-modal.component';
import { NumericTextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { CreateOrEditInstructorUserModalComponent } from './instructors/instructors/create-or-edit-instructor-user-modal.component';

@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        FileUploadModule,
        ModalModule.forRoot(),
        TabsModule.forRoot(),
        TooltipModule.forRoot(),
        PopoverModule.forRoot(),
        BsDropdownModule.forRoot(),
        BsDatepickerModule.forRoot(),
        AdminRoutingModule,
        UtilsModule,
        AppCommonModule,
        TableModule,
        TreeModule,
        DragDropModule,
        ContextMenuModule,
        PaginatorModule,
        PrimeNgFileUploadModule,
        AutoCompleteModule,
        EditorModule,
        InputMaskModule,
        NgxChartsModule,
        CountoModule,
        TextMaskModule,
        ImageCropperModule,
        NgMultiSelectDropDownModule.forRoot(),
        NumericTextBoxModule
    ],
    declarations: [
		PredefinedTheoryLessonsComponent,
		ViewPredefinedTheoryLessonModalComponent,		CreateOrEditPredefinedTheoryLessonModalComponent,
		PredefinedDrivingLessonsComponent,
		ViewPredefinedDrivingLessonModalComponent,		CreateOrEditPredefinedDrivingLessonModalComponent,
		FormsComponent,
      CreateOrEditInstructorUserModalComponent,
		PricePackagesComponent,

		ProductsComponent,
		CreateOrEditProductModalComponent,
		SimulatorsComponent,
		ViewSimulatorModalComponent,		CreateOrEditSimulatorModalComponent,
    SimulatorOfficeLookupTableModalComponent,
		OfficesComponent,
		ViewOfficeModalComponent,		CreateOrEditOfficeModalComponent,
		VehiclesComponent,
		ViewVehicleModalComponent,		CreateOrEditVehicleModalComponent,
    VehicleLicenseClassLookupTableModalComponent, VehicleInstructorLookupTableModalComponent,
		DrivingLessonTopicsComponent,
		ViewDrivingLessonTopicModalComponent,		CreateOrEditDrivingLessonTopicModalComponent,
		InstructorsComponent,
		ViewInstructorModalComponent,		CreateOrEditInstructorModalComponent,
    LicenseClassLookupTableModalComponent, OfficeLookupTableModalComponent,
		TheoryLessonTopicsComponent,
		ViewTheoryLessonTopicModalComponent,		CreateOrEditTheoryLessonTopicModalComponent,
		LicenseClassesComponent,
    ViewLicenseClassModalComponent,		CreateOrEditLicenseClassModalComponent,
        UsersComponent,
        PermissionComboComponent,
        RoleComboComponent,
        CreateOrEditUserModalComponent,
        EditUserPermissionsModalComponent,
        PermissionTreeComponent,
        FeatureTreeComponent,
        OrganizationUnitsTreeComponent,
        RolesComponent,
        CreateOrEditRoleModalComponent,
        AuditLogsComponent,
        AuditLogDetailModalComponent,
        HostSettingsComponent,
        InstallComponent,
        MaintenanceComponent,
        EditionsComponent,
        CreateEditionModalComponent,
        EditEditionModalComponent,
        MoveTenantsToAnotherEditionModalComponent,
        LanguagesComponent,
        LanguageTextsComponent,
        CreateOrEditLanguageModalComponent,
        TenantsComponent,
        CreateTenantModalComponent,
        EditTenantModalComponent,
        TenantFeaturesModalComponent,
        CreateOrEditLanguageModalComponent,
        EditTextModalComponent,
        OrganizationUnitsComponent,
        OrganizationTreeComponent,
        OrganizationUnitMembersComponent,
        OrganizationUnitRolesComponent,
        CreateOrEditUnitModalComponent,
        TenantSettingsComponent,
        HostDashboardComponent,
        EditionComboComponent,
        InvoiceComponent,
        SubscriptionManagementComponent,
        AddMemberModalComponent,
        AddRoleModalComponent,
        DemoUiComponentsComponent,
        DemoUiDateTimeComponent,
        DemoUiSelectionComponent,
        DemoUiFileUploadComponent,
        DemoUiInputMaskComponent,
        DemoUiEditorComponent,
        UiCustomizationComponent,
        DefaultThemeUiSettingsComponent,
        Theme2ThemeUiSettingsComponent,
        Theme3ThemeUiSettingsComponent,
        Theme4ThemeUiSettingsComponent,
        Theme5ThemeUiSettingsComponent,
        Theme6ThemeUiSettingsComponent,
        Theme7ThemeUiSettingsComponent,
        Theme8ThemeUiSettingsComponent,
        Theme9ThemeUiSettingsComponent,
        Theme10ThemeUiSettingsComponent,
        Theme12ThemeUiSettingsComponent,
        Theme11ThemeUiSettingsComponent
    ],
    exports: [
        AddMemberModalComponent,
        AddRoleModalComponent
    ],
    providers: [
        ImpersonationService,
        TreeDragDropService,
        { provide: BsDatepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerConfig },
        { provide: BsDaterangepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDaterangepickerConfig },
        { provide: BsLocaleService, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerLocale }
    ]
})
export class AdminModule { }
