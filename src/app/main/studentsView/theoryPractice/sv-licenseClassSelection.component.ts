import { Component, Injector, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as moment from 'moment';


@Component({
    templateUrl: './sv-licenseClassSelection.component.html',      
    animations: [appModuleAnimation()]
})
export class SVLicenseClassSelectionComponent extends AppComponentBase implements OnInit {

    licenseClasses : any[];

    constructor(
        injector: Injector,       
    ) {
        super(injector);
      
    }

    ngOnInit(): void {
        this.licenseClasses = [{
            pictureUrl: "/assets/onlineTheory/licenceClassPictures/B_PassengerCar.png",
            title: "B",
            description: "Passenger Car"
        },
        {
            pictureUrl: "/assets/onlineTheory/licenceClassPictures/BE_PassengerCarTrailer.png",
            title: "BE",
            description: "Passenger car with trailer"
        },
        {
            pictureUrl: "/assets/onlineTheory/licenceClassPictures/A_Motorcycle.png",
            title: "A",
            description: "Motorcycle"
        }];
    }

    getLicenseTasks(licenseClassName : string) : void  {
        console.log("selected class: " + licenseClassName);
    }


}