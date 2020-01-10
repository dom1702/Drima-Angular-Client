import { Component, ViewChild, Injector, Output, EventEmitter, OnInit } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { StudentsServiceProxy, CreateOrEditStudentDto, StudentDto, GetFreeCoursesForStudentDto, PricePackageDto, AssignToCourseInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';

@Component({
    selector: 'assignStudentToCourseModal',
    templateUrl: './assign-student-to-course-modal.component.html'
})
export class AssignStudentToCourseModalComponent extends AppComponentBase implements OnInit {

    @ViewChild('assignToCourseModal') modal: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    student : StudentDto;

    selectedCourse: GetFreeCoursesForStudentDto;
    availableCourses: GetFreeCoursesForStudentDto[];

    selectedPricePackage: PricePackageDto;

    sendEnrollmentMail : boolean;

    constructor(
        injector: Injector,
        private _studentsServiceProxy: StudentsServiceProxy,
    ) {
        super(injector);
    }

    ngOnInit() {

        

    }

    show(student: StudentDto): void {

        this.student = student;

        this.selectedCourse = null;
        this.selectedPricePackage = null;
        this.sendEnrollmentMail = false;

        this._studentsServiceProxy.getFreeCoursesForStudent(this.student.id).subscribe(result => {
            this.availableCourses = result
        });

        this.active = true;
        this.modal.show();
 
    }

    save(): void {
        this.saving = true;

        console.log(this.selectedCourse);
        console.log(this.selectedPricePackage);

        var input : AssignToCourseInput = new AssignToCourseInput();

        input.studentId = this.student.id;
        input.courseId = this.selectedCourse.courseId;
        input.pricePackage = this.selectedPricePackage;
        input.sendEnrollmentEmail = this.sendEnrollmentMail;

        this._studentsServiceProxy.assignToCourse(input)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {

        this.active = false;
        this.modal.hide();
    }
}
