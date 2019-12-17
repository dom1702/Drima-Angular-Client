import { Component, Injector, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentsServiceProxy  } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FileDownloadService } from '@shared/utils/file-download.service';

import * as _ from 'lodash';
import { SVBookDrivingLessonLookupSchedulerModalComponent } from './sv-book-drivingLesson-lookup-scheduler-modal.component';

@Component({
    templateUrl: './sv-book-drivingLesson.component.html',
    encapsulation: ViewEncapsulation.None,   
    animations: [appModuleAnimation()]
})

export class SVBookDrivingLessonComponent extends AppComponentBase implements OnInit {

    @ViewChild('schedulerModal') 
    schedulerModal : SVBookDrivingLessonLookupSchedulerModalComponent;
    
    dropdownSettings = {};
    dropdownListIds = [];
    dropdownList = [];
    selectedVehicle;
    selectedType;
    placeholder;

    ismeridian = false;  
    dropdownListVehicles = [];
    dropdownListLessonTypes = [];
    
    constructor(
        injector: Injector) {
        super(injector);
    }

    ngOnInit() {
        this.dropdownSettings = {
            singleSelection: true,
            idField: 'item_id',
            textField: 'item_text',
        };

        this.dropdownListVehicles = [
            {
                item_id: 0, item_text: "Golf GTI"
            },
            {
                item_id: 1, item_text: "TESLA Model 3"
            }
        ];

        this.dropdownListLessonTypes = [
            {
                item_id: 0, item_text: "City"
            },
            {
                item_id: 1, item_text: "Rural"
            },
            {
                item_id: 2, item_text: "Darkness"
            },
            {
                item_id: 3, item_text: "Simulator"
            }
        ];
    }

    onItemSelect(item: any) {
        console.log(item);
    }

    createDate(): void {
        console.debug("scheduler view child: " + this.schedulerModal);
        console.debug("data " + this.schedulerModal.data);
        console.debug("scheduler " + this.schedulerModal.scheduleObj);
        //this.schedulerModal.show();
    }

}