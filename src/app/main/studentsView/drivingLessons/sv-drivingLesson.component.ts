import { Component, Injector, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentsServiceProxy, CourseDto, StudentsViewServiceProxy, StudentCourseDrivingLessonsDto, SVDrivingLessonDto  } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FileDownloadService } from '@shared/utils/file-download.service';

import * as _ from 'lodash';
import { SVBookDrivingLessonLookupSchedulerModalComponent } from './sv-book-drivingLesson-lookup-scheduler-modal.component';
import { StudentViewHelper } from '../studentViewHelper.component';

@Component({
    templateUrl: './sv-drivingLesson.component.html',
    encapsulation: ViewEncapsulation.None,   
    animations: [appModuleAnimation()]
})

export class SVDrivingLessonComponent extends AppComponentBase implements OnInit {

    selectedStudentCourse: CourseDto;
    studentCourses: CourseDto[];

    drivingLessons: StudentCourseDrivingLessonsDto;

    drivingLessonsList : SVDrivingLessonDto[];
    
    constructor(
        injector: Injector,
        private _studentViewService: StudentsViewServiceProxy,
        private _helper : StudentViewHelper) {
        super(injector);
    }

    ngOnInit(): void {
        if(this._helper.studentsCourses != null && this._helper.studentData != null)
            this.loadData();

            this._helper.onInit().subscribe(() => {
            this.loadData();
        });
    }

    loadData()
    {
        this.loadCourseSelection();
        this.loadDrivingLessons();
    }

    loadCourseSelection()
    {
        this.studentCourses = [];

        for(var i = 0; i < this._helper.studentsCourses.length; i++)
        {
            this.studentCourses.push(this._helper.studentsCourses[i].course);
        }

        this.selectedStudentCourse = this._helper.selectedCourse.course;
    }

    loadDrivingLessons()
    {
        abp.ui.setBusy(undefined, '', 1);
        this._studentViewService.getPredefinedDrivingLessonsOfCourse(this.selectedStudentCourse.id).subscribe((result) => 
        {
            abp.ui.clearBusy();
            this.drivingLessons = result;
        });

        this._studentViewService.getAllDrivingLessonsOfStudent(this.selectedStudentCourse.id).subscribe((result) => 
        {
            abp.ui.clearBusy();
            this.drivingLessonsList = result;
        });
    }

    courseChanged() : void{
        this._helper.setSelectedStudentCourse(this.selectedStudentCourse);

        this.loadDrivingLessons();
    }
}