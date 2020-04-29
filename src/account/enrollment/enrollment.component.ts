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
    SubscriptionStartType
} from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';

@Component({
    selector: 'enrollment',
    templateUrl: './enrollment.component.html',
    styleUrls: ['./enrollment.component.less', './enrollment.min.css'],
    encapsulation: ViewEncapsulation.None,
    animations: [accountModuleAnimation()]
})
export class EnrollmentComponent extends AppComponentBase implements OnInit {

    licenseClasses : any[] = 
    [
        {
            className: "Class B",
            subtitle: "Passenger car",
            description: "Choose this class if you want to drive a normal car",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-b.jpg?__blob=normal"
        },
        {
            className: "Class A",
            subtitle: "Motorcycle",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-a.jpg?__blob=normal"
        },
        {
            className: "Class BE",
            subtitle: "Passenger car with trailer",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-be.jpg?__blob=normal"
        },
        {
            className: "Class M",
            subtitle: "Motorcycle 50 ccm",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-am.jpg?__blob=normal"
        },
        {
            className: "Class AM125",
            subtitle: "Motorcycle 125 ccm",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-a2.jpg?__blob=normal"
        },
        {
            className: "Moped",
            subtitle: "Motorcycle 50 ccm, 25 km/h",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-am.jpg?__blob=normal"
        }
    ]

    licenseClassesOwned : any[] = 
    [
        {
            className: "Class B",
            subtitle: "Passenger car",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-b.jpg?__blob=normal",
            isOwned: false,
        },
        {
            className: "Class A",
            subtitle: "Motorcycle",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-a.jpg?__blob=normal",
            isOwned: false,
        },
        {
            className: "Class BE",
            subtitle: "Passenger car with trailer",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-be.jpg?__blob=normal",
            isOwned: false,
        },
        {
            className: "Class M",
            subtitle: "Motorcycle 50 ccm",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-am.jpg?__blob=normal",
            isOwned: false,
        },
        {
            className: "Class AM125",
            subtitle: "Motorcycle 125 ccm",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-a2.jpg?__blob=normal",
            isOwned: false,
        },
        {
            className: "Moped",
            subtitle: "Motorcycle 50 ccm, 25 km/h",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-am.jpg?__blob=normal",
            isOwned: false,
        }
    ]

    locations : any[] = 
    [
        {
            officeName: "Office Philippsthal",
            address: "Hattorfer Street 20, 36269 Philippsthal",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-b.jpg?__blob=normal",
        },
        {
            officeName: "Office Heringen",
            address: "Lmao Street 20, 36268 Heringen",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-b.jpg?__blob=normal",
        },
        {
            officeName: "Office Bad Hersfeld",
            address: "Foo Street 20, 36261 Bad Hersfeld",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-b.jpg?__blob=normal",
        },
    ]

    courses : any[] = 
    [
        {
            name: "Course B April 2020",
            class: "B",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-b.jpg?__blob=normal",
        },
    ]

    pricePackages : any[] = 
    [
        {
            name: "Price Package A",
        },
    ]

    activeDivClass = "p-3 mb-2 bg-primary text-white";
    inactiveDivClass = "p-3 mb-2 bg-light text-dark";

    licenseClassDivClass = this.activeDivClass;
    licenseClassOwnedDivClass = this.inactiveDivClass;
    locationDivClass = this.inactiveDivClass;
    coursesDivClass = this.inactiveDivClass;
    pricePackageDivClass = this.inactiveDivClass;
    yourDataDivClass = this.inactiveDivClass;

    currentPageNumber = 5;
    maxPageNumber = 6;
   
    isUserLoggedIn = false;

    editionIcons: string[] = ['flaticon-open-box', 'flaticon-rocket', 'flaticon-gift', 'flaticon-confetti', 'flaticon-cogwheel-2', 'flaticon-app', 'flaticon-coins', 'flaticon-piggy-bank', 'flaticon-bag', 'flaticon-lifebuoy', 'flaticon-technology-1', 'flaticon-cogwheel-1', 'flaticon-infinity', 'flaticon-interface-5', 'flaticon-squares-3', 'flaticon-interface-6', 'flaticon-mark', 'flaticon-business', 'flaticon-interface-7', 'flaticon-list-2', 'flaticon-bell', 'flaticon-technology', 'flaticon-squares-2', 'flaticon-notes', 'flaticon-profile', 'flaticon-layers', 'flaticon-interface-4', 'flaticon-signs', 'flaticon-menu-1', 'flaticon-symbol'];

    constructor(
        injector: Injector,
        private _tenantRegistrationService: TenantRegistrationServiceProxy,
        private _subscriptionService: SubscriptionServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        this.isUserLoggedIn = abp.session.userId > 0;
    }

    goToNextPage()
    {
        if(this.currentPageNumber + 1 == this.maxPageNumber)
            return; 

        this.currentPageNumber++;
        this.switchActivePageIndicator(this.currentPageNumber);

        console.log(this.licenseClassesOwned[0].isOwned);
        console.log(this.licenseClassesOwned[1].isOwned);
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
}
