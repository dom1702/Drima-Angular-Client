﻿import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import * as ApiServiceProxies from './service-proxies';

@NgModule({
    providers: [
        ApiServiceProxies.EnrollmentsServiceProxy,        
        ApiServiceProxies.PredefinedTheoryLessonsServiceProxy,        
        ApiServiceProxies.CoursesServiceProxy,        
        ApiServiceProxies.PredefinedDrivingLessonsServiceProxy,        
        ApiServiceProxies.SimulatorLessonsServiceProxy,        
        ApiServiceProxies.FormsServiceProxy,        
        ApiServiceProxies.PricePackagesServiceProxy,        
        ApiServiceProxies.StudentInvoicesServiceProxy,        
        ApiServiceProxies.ProductsServiceProxy,        
        ApiServiceProxies.SimulatorsServiceProxy,        
        ApiServiceProxies.OfficesServiceProxy,        
        ApiServiceProxies.VehiclesServiceProxy,        
        ApiServiceProxies.DrivingLessonTopicsServiceProxy,        
        ApiServiceProxies.InstructorsServiceProxy,        
        ApiServiceProxies.TheoryLessonTopicsServiceProxy,        
        ApiServiceProxies.DrivingLessonsServiceProxy,        
        ApiServiceProxies.StudentsServiceProxy,        
        ApiServiceProxies.LicenseClassesServiceProxy,        
        ApiServiceProxies.AuditLogServiceProxy,
        ApiServiceProxies.CachingServiceProxy,
        ApiServiceProxies.ChatServiceProxy,
        ApiServiceProxies.CommonLookupServiceProxy,
        ApiServiceProxies.EditionServiceProxy,
        ApiServiceProxies.FriendshipServiceProxy,
        ApiServiceProxies.HostSettingsServiceProxy,
        ApiServiceProxies.InstallServiceProxy,
        ApiServiceProxies.LanguageServiceProxy,
        ApiServiceProxies.NotificationServiceProxy,
        ApiServiceProxies.OrganizationUnitServiceProxy,
        ApiServiceProxies.PermissionServiceProxy,
        ApiServiceProxies.ProfileServiceProxy,
        ApiServiceProxies.RoleServiceProxy,
        ApiServiceProxies.SessionServiceProxy,
        ApiServiceProxies.TenantServiceProxy,
        ApiServiceProxies.TenantDashboardServiceProxy,
        ApiServiceProxies.TenantSettingsServiceProxy,
        ApiServiceProxies.TimingServiceProxy,
        ApiServiceProxies.UserServiceProxy,
        ApiServiceProxies.UserLinkServiceProxy,
        ApiServiceProxies.UserLoginServiceProxy,
        ApiServiceProxies.WebLogServiceProxy,
        ApiServiceProxies.AccountServiceProxy,
        ApiServiceProxies.TokenAuthServiceProxy,
        ApiServiceProxies.TenantRegistrationServiceProxy,
        ApiServiceProxies.HostDashboardServiceProxy,
        ApiServiceProxies.PaymentServiceProxy,
        ApiServiceProxies.DemoUiComponentsServiceProxy,
        ApiServiceProxies.InvoiceServiceProxy,
        ApiServiceProxies.SubscriptionServiceProxy,
        ApiServiceProxies.InstallServiceProxy,
        ApiServiceProxies.UiCustomizationSettingsServiceProxy,
        ApiServiceProxies.PayPalPaymentServiceProxy,
        ApiServiceProxies.StripePaymentServiceProxy,
        ApiServiceProxies.TheoryLessonsServiceProxy,
        ApiServiceProxies.TheoryLessonTopicsServiceProxy,
        ApiServiceProxies.LicenseClassesServiceProxy,
        ApiServiceProxies.DrivingLessonsServiceProxy,
        ApiServiceProxies.DrivingLessonTopicsServiceProxy,
        ApiServiceProxies.StudentsServiceProxy,
        ApiServiceProxies.InstructorsServiceProxy,
        ApiServiceProxies.AppointmentsServiceProxy,
        ApiServiceProxies.SchedulerServiceProxy,
        ApiServiceProxies.PersonalSchedulerServiceProxy,
        ApiServiceProxies.InstructorsOwnDrivingLessonsServiceProxy,
        ApiServiceProxies.StudentsViewServiceProxy,
        ApiServiceProxies.OwnAppointmentsServiceProxy,
        ApiServiceProxies.StudentFormsServiceProxy,
        ApiServiceProxies.OnlineTheoryServiceProxy,
        { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true }
    ]
})
export class ServiceProxyModule { }
