import { Component, Injector, ViewEncapsulation, ViewChild, Input, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http } from '@angular/http';
import { StudentsServiceProxy, StudentDto, PricePackagesServiceProxy, StudentInvoiceDto, StudentInvoicesServiceProxy, StudentFormsServiceProxy, CreatedFormDto, FormDto, FormsServiceProxy, DownloadStudentFormInput, StudentCourseDrivingLessonsDto } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FileDownloadService } from '@shared/utils/file-download.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { BsDropdownModule, BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { StudentsOverviewComponent } from './students-overview.component';
import { Table } from 'primeng/table';

@Component({
    selector: 'students-overview-lessons',
    templateUrl: './students-overview-lessons.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
    providers: [{ provide: BsDropdownConfig, useValue: { isAnimated: true, autoClose: true } }]
})
export class StudentsOverviewLessonsComponent extends AppComponentBase implements OnChanges{

    @ViewChild('dataTable') dataTable: Table;

    @Input() student: StudentDto;
    @Input() parentOverview: StudentsOverviewComponent;
    @Input() drivingLessons: StudentCourseDrivingLessonsDto;
    
    constructor(
        injector: Injector,
        private _studentsServiceProxy: StudentsServiceProxy,
        private _notifyService: NotifyService,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnChanges(): void {
        if(this.drivingLessons == null)
        return;

        console.log(this.drivingLessons);
        var drivingLessons : any[] = [];

        for (let i of this.drivingLessons.basicLessons) {
            let lesson : any = 
            {

            startTime: i.startTime,
            instructorNames: "", // not implemented
            vehicleNameBrandModel:"", // not implemented
            length: i.length,
            completed: i.completed,
            doneOnSimulator: false, // not implemented
            }

            drivingLessons.push(lesson);
          }

        //   for (let i of this.drivingLessons.predefinedDrivingLessons) {
        //     var lesson : any;

        //     lesson.startTime = i.startTime;
        //     lesson.instructorNames = ""; // not implemented
        //     lesson.vehicleNameBrandModel = ""; // not implemented
        //     lesson.length = i.length;
        //     lesson.completed = i.completed;
        //     lesson.doneOnSimulator = false; // not implemented

        //     drivingLessons.push(lesson);
        //   }
       
        this.primengTableHelper.totalRecordsCount = drivingLessons.length;
        this.primengTableHelper.records = drivingLessons;

        console.log(this.primengTableHelper.records);
    }

   
}
