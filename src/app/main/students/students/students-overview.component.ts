import { Component, Injector, ViewEncapsulation, ViewChild, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { StudentsServiceProxy, StudentDto, StudentCourseDto } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FileDownloadService } from '@shared/utils/file-download.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription, Observable, Observer } from 'rxjs';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { StudentsOverviewPricePackageComponent } from './students-overview-pricePackage.component';

@Component({
    templateUrl: './students-overview.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class StudentsOverviewComponent extends AppComponentBase {

    //@ViewChild(StudentsOverviewPricePackageComponent) pricePackageView: StudentsOverviewPricePackageComponent;

    subscription: Subscription;

    overallActive: boolean = false;
    overviewTabName: string = this.l("Overview");
    pricePackageTabName: string = this.l("PricePackage");
    studentInvoicesTabName: string = this.l("StudentInvoices");
    studentFormsTabName: string = this.l("Forms");

    student: StudentDto;
    pricePackageName: string = "";

    selectedStudentCourse: StudentCourseDto;
    studentCourses: StudentCourseDto[];

    @Output() courseChanged = new EventEmitter();

    constructor(
        injector: Injector,
        private _studentsServiceProxy: StudentsServiceProxy,
        private _notifyService: NotifyService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _fileDownloadService: FileDownloadService,
        private location: Location
    ) {
        super(injector);
    }

    ngOnInit(): void {

        this.subscription = this._activatedRoute.params.subscribe(params => {

            const id = params['id'] || '';

            this._studentsServiceProxy.getStudentForView(id).subscribe(result => {

                this.student = result.student;

                this.overallActive = true;

                this._studentsServiceProxy.getAllCourses(this.student.id).subscribe(result => {

                    if(this.studentCourses != null)
                    {
                    for(var i = 0; i < this.studentCourses.length; i++)
                        console.log(this.studentCourses[i]);
                    }

                    this.studentCourses = result

                    for(var i = 0; i < this.studentCourses.length; i++)
                    console.log(this.studentCourses[i]);

                    if(this.studentCourses.length > 0)
                    {
                        this.selectedStudentCourse = this.studentCourses[0];

                        // Emit manually once on start
                        this.courseChanged.emit();
                        
                        this.pricePackageName = this.selectedStudentCourse.pricePackageName;

                        if(this.selectedStudentCourse.pricePackageModified)
                            this.pricePackageName = this.pricePackageName + " (modified for this particular student)";
                    }
                });
            });
        });
    }

    public UpdateStudentView(): Observable<any> {
    
        return Observable.create((observer: Observer<any>) => {
            this._studentsServiceProxy.getStudentForView(this.student.id).subscribe(result => {

                this.student = result.student;

                this._studentsServiceProxy.getAllCourses(this.student.id).subscribe(result => {
                    this.studentCourses = result
                    console.log(this.studentCourses.length);
                    if(this.studentCourses.length > 0)
                    {
                        console.log(this.studentCourses[0]);
                        this.selectedStudentCourse = this.studentCourses[0];
                        
                        if(this.selectedStudentCourse != null)
                        {
                            this.pricePackageName = this.selectedStudentCourse.pricePackageName;
        
                            if(this.selectedStudentCourse.pricePackageModified)
                                this.pricePackageName = this.pricePackageName + " (modified for this particular student)";
                        }
                        else
                            this.pricePackageName = "";
                    }
                    else
                    {
                        this.selectedStudentCourse = null;
                        this.pricePackageName = "";
                    }

                    observer.next(null)
                    observer.complete()
                });

              
            });

        });
    }

    removeFromSelectedCourse() : void{
        this.message.confirm(
            'Do you really want to remove this student from the currently selected course?',
            (isConfirmed) => {
                if (isConfirmed) {
                    this._studentsServiceProxy.removeFromCourse(this.student.id, this.selectedStudentCourse.course.id, true).subscribe(() => {
                        this.notify.success(this.l('SuccessfullyRemoved'));
                        this.UpdateStudentView().subscribe();
                    })
                }
            }
        );
       
    }

    goBack() {
        this.location.back();
    }
}
