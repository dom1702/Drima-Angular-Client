import { Component, Injector, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as moment from 'moment';


@Component({
    templateUrl: './sv-licenseClassSelection.component.html', 
    //.ui-card-title {
    //    text-align: center;
    //}   
    animations: [appModuleAnimation()]
})
export class SVLicenseClassSelection extends AppComponentBase implements OnInit {

    licenseClasses : any[];

    constructor(
        injector: Injector,       
    ) {
        super(injector);
      
    }

    ngOnInit(): void {
        this.licenseClasses = [{
            pictureUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-b.jpg?__blob=normal",
            title: "B",
            description: "Passenger Car"
        },
        {
            pictureUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-be.jpg?__blob=normal",
            title: "BE",
            description: "Passenger car with trailer"
        },
        {
            pictureUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-a.jpg?__blob=normal",
            title: "A",
            description: "Motorcycle"
        }];
    }


}