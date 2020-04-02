import { Component, Injector, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudentsViewServiceProxy, TenantDashboardServiceProxy, SVTheoryLessonDto, StudentCoursePredefinedTheoryLessonDto, CourseDto, OnlineTheoryServiceProxy  } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as _ from 'lodash';
import * as moment from 'moment';
import { StudentViewHelper } from '../studentViewHelper.component';

@Component({
    templateUrl: './sv-theoryLessons.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})

export class SVTheoryLessonsComponent extends AppComponentBase implements OnInit {
    
    selectedStudentCourse: CourseDto;
    studentCourses: CourseDto[];

    theoryLessons: StudentCoursePredefinedTheoryLessonDto[];
    theoryLessonsList : SVTheoryLessonDto[];
       
    constructor(
        injector: Injector,
        private _studentViewService: StudentsViewServiceProxy,
        private _helper : StudentViewHelper,
        private _onlineTheoryService : OnlineTheoryServiceProxy
    ) {
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
        this.loadTheoryLessons();
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

    loadTheoryLessons()
    {
        abp.ui.setBusy(undefined, '', 1);
        this._studentViewService.getPredefinedTheoryLessonsOfCourse(this.selectedStudentCourse.id).subscribe((result) => 
        {
            abp.ui.clearBusy();
            this.theoryLessons = result;
        });

        this._studentViewService.getAllTheoryLessonsOfStudent(this.selectedStudentCourse.id).subscribe((result) => 
        {
            abp.ui.clearBusy();
            this.theoryLessonsList = result;
        });
    }

    courseChanged() : void{
        this._helper.setSelectedStudentCourse(this.selectedStudentCourse);
        this.loadTheoryLessons();
    }
}
