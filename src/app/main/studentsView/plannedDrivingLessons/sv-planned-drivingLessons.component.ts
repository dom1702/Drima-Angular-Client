import { Component, Injector, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudentsViewServiceProxy, TenantDashboardServiceProxy  } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FileDownloadService } from '@shared/utils/file-download.service';

import * as _ from 'lodash';
import * as moment from 'moment';
import { Paginator, LazyLoadEvent } from 'primeng/primeng';
import { Table } from 'primeng/table';

class LessonsPieChart{
  
    drivingScheme: any = {
        name: 'custom',
        selectable: true,
        group: 'Ordinal',
        domain: [
            'green', 'grey'
        ]
    };

    theoryScheme: any = {
        name: 'custom',
        selectable: true,
        group: 'Ordinal',
        domain: [
            'yellow', 'grey'
        ]
    };

    scheme: any;
    chartData: any[] = [];

    constructor(private _dashboardService: TenantDashboardServiceProxy) {
    }

    init(data: number[]) {

        let formattedData = [];
        for (let i = 0; i < data.length; i++) {
            formattedData.push({
                'name': this.getChartItemName(i),
                'value': data[i]
            });
        }

        this.chartData = formattedData;
    }

    getChartItemName(index: number) {
        if (index === 0) {
            return 'Completed Lessons';
        }

        if (index === 1) {
            return 'Open Lessons';
        }

        return 'Other';
    }
}

@Component({
    templateUrl: './sv-planned-drivingLessons.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})

export class SVPlannedDrivingLessonsComponent extends AppComponentBase implements OnInit {
       
    dummyTheoryLessonsCurr = 17;
    dummyTheoryLessonsNeeded = 28;
    dummyExerciseLessonsCurr = 10;
    dummyExerciseLessonsNeeded = 36;

    lessonsPieChart: LessonsPieChart;

    @ViewChild('paginator') paginator: Paginator;
    @ViewChild('dataTable') dataTable: Table;
    
    studentFirstName : string = "Test FirstName";
    studentLastName : string = "Test LastName";

    filterText = '';
    maxLengthFilter : number;
    maxLengthFilterEmpty : number;
    minLengthFilter : number;
    minLengthFilterEmpty : number;
    maxStartTimeFilter : moment.Moment;
    minStartTimeFilter : moment.Moment;
    drivingLessonTopicTopicFilter = '';
    licenseClassClassFilter = '';
    instructorFilter = '';
    showPlannedLessons : boolean = true;

    constructor(
        injector: Injector,
        private _studentViewServiceProxy: StudentsViewServiceProxy,
        private _dashboardService: TenantDashboardServiceProxy
    ) {
        super(injector);
        this.lessonsPieChart = new LessonsPieChart(this._dashboardService);
    }

    ngOnInit(): void {
            this._studentViewServiceProxy.getPersonalData().subscribe(result => {
            this.studentFirstName  = result.firstName;
            this.studentLastName = result.lastName;
        });
               
        this.lessonsPieChart.init(this.getChartDataPercent(this.dummyExerciseLessonsCurr, this.dummyExerciseLessonsNeeded));
        this.lessonsPieChart.scheme = this.lessonsPieChart.drivingScheme;       
    }

    getChartDataPercent(current : number, needed : number ) : number[]{
        let neededPercOnne = (100 / needed);
        let currPerc = current * neededPercOnne;
        return  [currPerc, 100-currPerc];
    }

    getDrivingLessonsByProgress() {
        if(this.showPlannedLessons)
        {
            this.getPlannedDrivingLessons();
        }
        else
        {
            this.getCompletedDrivingLessons();
        }
    }

    getPlannedDrivingLessons(event? : LazyLoadEvent) { 
        var startDate = moment().startOf('day');
        var endDate = startDate.clone().add(2, 'week');
        this.showPlannedLessons = true;

        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;       
        }

        this.primengTableHelper.showLoadingIndicator();
        this._studentViewServiceProxy.getPlannedDrivingLessons(
            startDate, 
            endDate,
            this.filterText,
            this.maxLengthFilter == null ? this.maxLengthFilterEmpty: this.maxLengthFilter,
            this.minLengthFilter == null ? this.minLengthFilterEmpty: this.minLengthFilter,
            this.maxStartTimeFilter,
            this.minStartTimeFilter,
            this.drivingLessonTopicTopicFilter,
            this.licenseClassClassFilter,
            this.instructorFilter,
            this.primengTableHelper.getSorting(this.dataTable),
            this.primengTableHelper.getSkipCount(this.paginator, event),
            this.primengTableHelper.getMaxResultCount(this.paginator, event)).subscribe(result => {
                this.primengTableHelper.totalRecordsCount = result.drivingLessons.length;
                this.primengTableHelper.records = result.drivingLessons;
                this.primengTableHelper.hideLoadingIndicator();
        });       
    }

    getCompletedDrivingLessons(event? : LazyLoadEvent) { 

        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;       
        }

        this.showPlannedLessons = false;      
        this.primengTableHelper.showLoadingIndicator();
        this._studentViewServiceProxy.getCompletedDrivingLessons().subscribe(result => {
            this.primengTableHelper.totalRecordsCount = result.drivingLessons.length;
            this.primengTableHelper.records = result.drivingLessons;
            this.primengTableHelper.hideLoadingIndicator();
        });   
    }
}
