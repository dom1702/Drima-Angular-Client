import { Component, Injector, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    EditionSelectDto,
    EditionWithFeaturesDto,
    EditionsSelectOutput,
    FlatFeatureSelectDto,
    SubscriptionServiceProxy,
    TenantRegistrationServiceProxy,
    EditionPaymentType,
    SubscriptionStartType,
    EnrollmentsServiceProxy,
    GetAvailableLicenseClassesForEnrollmentDto,
    GetPossibleAlreadyOwnedLicenseClassesDto,
    GetOfficesForEnrollmentDto,
    GetCoursesFromOfficeDto,
    GetPricePackagesFromCourseDto,
    SubmitEnrollmentInput
} from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';
import { Language, LanguagesService } from '@app/shared/common/services/languages.service';
import { CountriesService, Country } from '@app/shared/common/services/countries.service';

@Component({
    selector: 'enrollment',
    templateUrl: './enrollment.component.html',
    styleUrls: ['./enrollment.component.less', './enrollment.min.css'],
    encapsulation: ViewEncapsulation.None,
    animations: [accountModuleAnimation()]
})
export class EnrollmentComponent extends AppComponentBase implements OnInit {

    licenseClasses : GetAvailableLicenseClassesForEnrollmentDto;
    licenseClassesOwned : GetPossibleAlreadyOwnedLicenseClassesDto;
    offices : GetOfficesForEnrollmentDto;
    courses : GetCoursesFromOfficeDto;
    pricePackages : GetPricePackagesFromCourseDto;

    currentNativeLanguage: string;
    languages: Language[];
    currentBirthCountry: string;
    countries: Country[];

    activeDivClass = "p-3 mb-2 bg-primary text-white";
    inactiveDivClass = "p-3 mb-2 bg-light text-dark";

    licenseClassDivClass = this.activeDivClass;
    licenseClassOwnedDivClass = this.inactiveDivClass;
    locationDivClass = this.inactiveDivClass;
    coursesDivClass = this.inactiveDivClass;
    pricePackageDivClass = this.inactiveDivClass;
    yourDataDivClass = this.inactiveDivClass;

    currentPageNumber = 0;
    maxPageNumber = 6;

    // Selected values
    selectedClass : string = "";
    officeId : number;
    courseId : number;
    pricePackageId : number
   
    isUserLoggedIn = false;

    editionIcons: string[] = ['flaticon-open-box', 'flaticon-rocket', 'flaticon-gift', 'flaticon-confetti', 'flaticon-cogwheel-2', 'flaticon-app', 'flaticon-coins', 'flaticon-piggy-bank', 'flaticon-bag', 'flaticon-lifebuoy', 'flaticon-technology-1', 'flaticon-cogwheel-1', 'flaticon-infinity', 'flaticon-interface-5', 'flaticon-squares-3', 'flaticon-interface-6', 'flaticon-mark', 'flaticon-business', 'flaticon-interface-7', 'flaticon-list-2', 'flaticon-bell', 'flaticon-technology', 'flaticon-squares-2', 'flaticon-notes', 'flaticon-profile', 'flaticon-layers', 'flaticon-interface-4', 'flaticon-signs', 'flaticon-menu-1', 'flaticon-symbol'];

    constructor(
        injector: Injector,
        private _tenantRegistrationService: TenantRegistrationServiceProxy,
        private _subscriptionService: SubscriptionServiceProxy,
        private _router: Router,
        private _languagesService: LanguagesService,
        private _countriesService: CountriesService,
        private _enrollmentService: EnrollmentsServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {

        this._countriesService.loadData().subscribe(result => {
            this.countries = result;

            for (var i = 0; i < this.countries.length; i++) {
                if (this.countries[i].name == 'Finland')
                    this.currentBirthCountry = this.countries[i].name;
            }

        });

        this._languagesService.loadData().subscribe(result => {
            this.languages = result;

            for (var i = 0; i < this.languages.length; i++) {
                if (this.languages[i].name == 'Finnish')
                    this.currentNativeLanguage = this.languages[i].name;
            }
        });

        this._enrollmentService.getAvailableLicenseClassesForEnrollment().subscribe(result => {
            this.licenseClasses = result;
        })

        this.isUserLoggedIn = abp.session.userId > 0;
    }

    goToNextPage()
    {
        return; 
        if(this.currentPageNumber + 1 == this.maxPageNumber)
            return; 

        this.currentPageNumber++;
        this.switchActivePageIndicator(this.currentPageNumber);
    }

    goToPage(pageNumber : number)
    {
        this.currentPageNumber = pageNumber;
        this.switchActivePageIndicator(pageNumber);
    }

    goToPreviousPage()
    {
        if(this.currentPageNumber == 0)
            return; 

        this.currentPageNumber--;
        this.switchActivePageIndicator(this.currentPageNumber);
    }

    switchActivePageIndicator(pageNumber : number)
    {
        this.licenseClassDivClass = this.inactiveDivClass;
        this.licenseClassOwnedDivClass = this.inactiveDivClass;
        this.locationDivClass = this.inactiveDivClass;
        this.coursesDivClass = this.inactiveDivClass;
        this.pricePackageDivClass = this.inactiveDivClass;
        this.yourDataDivClass = this.inactiveDivClass;

        switch(pageNumber) { 
            case 0: { 
                this.licenseClassDivClass = this.activeDivClass;
               break; 
            } 
            case 1: { 
                this.licenseClassOwnedDivClass = this.activeDivClass;
               break; 
            } 
            case 2: { 
                this.locationDivClass = this.activeDivClass;
                break; 
             } 
             case 3: { 
                this.coursesDivClass = this.activeDivClass;
                break; 
             } 
             case 4: { 
                this.pricePackageDivClass = this.activeDivClass;
                break; 
             } 
             case 5: { 
                this.yourDataDivClass = this.activeDivClass;
                break; 
             } 
         } 
    }

    classToAcquireSelected(selectedClass : string)
    {
        this.selectedClass = selectedClass;

        this._enrollmentService.getPossibleAlreadyOwnedLicenseClasses(this.selectedClass).subscribe(result => {
            this.licenseClassesOwned = result;
        })

        this.goToPage(1);
    }

    classesAlreadyOwnedSelected()
    {
        console.log(this.licenseClassesOwned);

        this._enrollmentService.getOffices(this.selectedClass).subscribe(result => {
            this.offices = result;
            console.log(this.offices);
        })

        this.goToPage(2);
    }

    officeSelected(officeId : number)
    {
        console.log(officeId);
        this.officeId = officeId;

        this._enrollmentService.getCoursesFromOffice(this.selectedClass, officeId).subscribe(result => {
            this.courses = result;
        })

        this.goToPage(3);
    }

    courseSelected(courseId : number)
    {
        console.log(courseId);
        this.courseId = courseId;

        this._enrollmentService.getPricePackagesFromCourse(courseId).subscribe(result => {
            this.pricePackages = result;
        })

        this.goToPage(4);
    }

    pricePackageSelected(pricePackageId : number)
    {
        console.log(pricePackageId);

        this.pricePackageId = pricePackageId;

        this.goToPage(5);
    }

    submit()
    {
        // var input :SubmitEnrollmentInput =
        // {
        //     firstName = ""
        // };
        // this._enrollmentService.submitEnrollment(courseId).subscribe(result => {

        //     abp.message.success('Success', 'You just enrolled in a new course. Please read the confirmation email for further information!');

        // })
        
    }
}
