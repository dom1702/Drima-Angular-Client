﻿import { NgModule } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { PredefinedTheoryLessonsComponent } from './lessons/predefinedTheoryLessons/predefinedTheoryLessons.component';
import { PredefinedDrivingLessonsComponent } from './lessons/predefinedDrivingLessons/predefinedDrivingLessons.component';
import { FormsComponent } from './forms/forms/forms.component';
import { PricePackagesComponent } from './sales/pricePackages/pricePackages.component';
import { ProductsComponent } from './sales/products/products.component';
import { SimulatorsComponent } from './resources/simulators/simulators.component';
import { OfficesComponent } from './resources/offices/offices.component';
import { VehiclesComponent } from './resources/vehicles/vehicles.component';
import { DrivingLessonTopicsComponent } from './templates/drivingLessonTopics/drivingLessonTopics.component';
import { InstructorsComponent } from './instructors/instructors/instructors.component';
import { TheoryLessonTopicsComponent } from './templates/theoryLessonTopics/theoryLessonTopics.component';
import { LicenseClassesComponent } from './templates/licenseClasses/licenseClasses.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { HostDashboardComponent } from './dashboard/host-dashboard.component';
import { DemoUiComponentsComponent } from './demo-ui-components/demo-ui-components.component';
import { EditionsComponent } from './editions/editions.component';
import { InstallComponent } from './install/install.component';
import { LanguageTextsComponent } from './languages/language-texts.component';
import { LanguagesComponent } from './languages/languages.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { OrganizationUnitsComponent } from './organization-units/organization-units.component';
import { RolesComponent } from './roles/roles.component';
import { HostSettingsComponent } from './settings/host-settings.component';
import { TenantSettingsComponent } from './settings/tenant-settings.component';
import { InvoiceComponent } from './subscription-management/invoice/invoice.component';
import { SubscriptionManagementComponent } from './subscription-management/subscription-management.component';
import { TenantsComponent } from './tenants/tenants.component';
import { UiCustomizationComponent } from './ui-customization/ui-customization.component';
import { UsersComponent } from './users/users.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                children: [
                    { path: 'lessons/predefinedTheoryLessons', component: PredefinedTheoryLessonsComponent, data: { permission: 'Pages.Administration.PredefinedTheoryLessons' }  },
                    { path: 'lessons/predefinedDrivingLessons', component: PredefinedDrivingLessonsComponent, data: { permission: 'Pages.Administration.PredefinedDrivingLessons' }  },
                    { path: 'forms/forms', component: FormsComponent, data: { permission: 'Pages.Administration.Forms' }  },
                    { path: 'sales/pricePackages', component: PricePackagesComponent, data: { permission: 'Pages.Administration.PricePackages' }  },
                    { path: 'sales/products', component: ProductsComponent, data: { permission: 'Pages.Administration.Products' }  },
                    { path: 'resources/simulators', component: SimulatorsComponent, data: { permission: 'Pages.Administration.Simulators' }  },
                    { path: 'resources/offices', component: OfficesComponent, data: { permission: 'Pages.Administration.Offices' }  },
                    { path: 'resources/vehicles', component: VehiclesComponent, data: { permission: 'Pages.Administration.Vehicles' }  },
                    { path: 'templates/drivingLessonTopics', component: DrivingLessonTopicsComponent, data: { permission: 'Pages.Administration.DrivingLessonTopics' }  },
                    { path: 'instructors/instructors', component: InstructorsComponent, data: { permission: 'Pages.Administration.Instructors' }  },
                    { path: 'templates/theoryLessonTopics', component: TheoryLessonTopicsComponent, data: { permission: 'Pages.Administration.TheoryLessonTopics' }  },
                    { path: 'templates/licenseClasses', component: LicenseClassesComponent, data: { permission: 'Pages.Administration.LicenseClasses' }  },
                    { path: 'users', component: UsersComponent, data: { permission: 'Pages.Administration.Users' } },
                    { path: 'roles', component: RolesComponent, data: { permission: 'Pages.Administration.Roles' } },
                    { path: 'auditLogs', component: AuditLogsComponent, data: { permission: 'Pages.Administration.AuditLogs' } },
                    { path: 'maintenance', component: MaintenanceComponent, data: { permission: 'Pages.Administration.Host.Maintenance' } },
                    { path: 'hostSettings', component: HostSettingsComponent, data: { permission: 'Pages.Administration.Host.Settings' } },
                    { path: 'editions', component: EditionsComponent, data: { permission: 'Pages.Editions' } },
                    { path: 'languages', component: LanguagesComponent, data: { permission: 'Pages.Administration.Languages' } },
                    { path: 'languages/:name/texts', component: LanguageTextsComponent, data: { permission: 'Pages.Administration.Languages.ChangeTexts' } },
                    { path: 'tenants', component: TenantsComponent, data: { permission: 'Pages.Tenants' } },
                    { path: 'organization-units', component: OrganizationUnitsComponent, data: { permission: 'Pages.Administration.OrganizationUnits' } },
                    { path: 'subscription-management', component: SubscriptionManagementComponent, data: { permission: 'Pages.Administration.Tenant.SubscriptionManagement' } },
                    { path: 'invoice/:paymentId', component: InvoiceComponent, data: { permission: 'Pages.Administration.Tenant.SubscriptionManagement' } },
                    { path: 'tenantSettings', component: TenantSettingsComponent, data: { permission: 'Pages.Administration.Tenant.Settings' } },
                    { path: 'hostDashboard', component: HostDashboardComponent, data: { permission: 'Pages.Administration.Host.Dashboard' } },
                    { path: 'demo-ui-components', component: DemoUiComponentsComponent, data: { permission: 'Pages.DemoUiComponents' } },
                    { path: 'install', component: InstallComponent },
                    { path: 'ui-customization', component: UiCustomizationComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class AdminRoutingModule {

    constructor(
        private router: Router
    ) {
        router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                window.scroll(0, 0);
            }
        });
    }
}
