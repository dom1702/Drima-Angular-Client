import { Component, Injector, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Http } from '@angular/http';
import { StudentsServiceProxy, StudentDto  } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FileDownloadService } from '@shared/utils/file-download.service';

import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
    templateUrl: './sv-book-drivingLesson.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class SVBookDrivingLessonComponent extends AppComponentBase {

    constructor(
        injector: Injector,
        private _studentsServiceProxy: StudentsServiceProxy,
        private _fileDownloadService: FileDownloadService,
        private _router: Router
    ) {
        super(injector);
    }


}