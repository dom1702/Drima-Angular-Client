import { Component, ViewChild, Injector, Output, EventEmitter, QueryList, ViewChildren } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { CoursesServiceProxy, CreateOrEditCourseDto, PredefinedDrivingLessonDto, PredefinedDrivingLessonsServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { OfficeLookupTableModalComponent } from '../../../shared/common/lookup/office-lookup-table-modal.component';
import { MultiSelectComponent } from '@syncfusion/ej2-angular-dropdowns';
import { Subscription } from 'rxjs';

@Component({
    selector: 'createOrEditCourseModal',
    templateUrl: './create-or-edit-course-modal.component.html'
})
export class CreateOrEditCourseModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('officeLookupTableModal') courseOfficeLookupTableModal: OfficeLookupTableModalComponent;
    @ViewChildren('pdl_multiselect') predefinedDL_Multiselect: QueryList<MultiSelectComponent>;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    course: CreateOrEditCourseDto = new CreateOrEditCourseDto();

    officeName = '';

    predefinedDrivingLessons: Object[];
    fields: Object = { text: 'dl', value: 'id' };
    placeholder: string = 'Select predefined driving lessons';

    private multiselectSubscription: Subscription;

    constructor(
        injector: Injector,
        private _coursesServiceProxy: CoursesServiceProxy,
        private _predefinedDrivingLessonsServiceProxy: PredefinedDrivingLessonsServiceProxy
    ) {
        super(injector);
    }

    UpdateMultiSelect() {
        this.multiselectSubscription = this.predefinedDL_Multiselect.changes.subscribe((comps: QueryList<MultiSelectComponent>) => {
            var selected: number[] = [];

            if (this.course.predefinedDrivingLessons != null) {

                for (var i = 0; i < this.course.predefinedDrivingLessons.length; i++) {
                    selected.push(this.course.predefinedDrivingLessons[i].id);
                }

                this.predefinedDL_Multiselect.first.value = selected;
            }

            this.multiselectSubscription.unsubscribe();
        });
    }

    show(courseId?: number): void {

        this.UpdateMultiSelect();

        this._predefinedDrivingLessonsServiceProxy.getAllForLookup().subscribe(result => {

            this.predefinedDrivingLessons = [];

            for (var i = 0; i < result.length; i++) {
                this.predefinedDrivingLessons.push(
                    {
                        id: result[i].id,
                        dl: result[i].name
                    }
                );
            }

            if (!courseId) {
                this.course = new CreateOrEditCourseDto();
                this.course.id = courseId;
                this.course.startDate = moment().startOf('day');
                this.course.lastEnrollmentDate = moment().startOf('day');
                this.officeName = '';

                this.active = true;
                this.modal.show();
            } else {
                this._coursesServiceProxy.getCourseForEdit(courseId).subscribe(result => {
                    this.course = result.course;

                    this.officeName = result.officeName;

                    this.active = true;
                    this.modal.show();


                });
            }


        });
    }

    save(): void {
        this.saving = true;

        if (this.predefinedDL_Multiselect.first.value != null) {
            this.course.predefinedDrivingLessons = [];
            for (var i = 0; i < this.predefinedDL_Multiselect.first.value.length; i++) {
                var pddl: PredefinedDrivingLessonDto = new PredefinedDrivingLessonDto()
                pddl.id = Number(this.predefinedDL_Multiselect.first.value[i]);
                this.course.predefinedDrivingLessons.push(pddl);
            }
        }

        this._coursesServiceProxy.createOrEdit(this.course)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    openSelectOfficeModal() {
        this.courseOfficeLookupTableModal.id = this.course.officeId;
        this.courseOfficeLookupTableModal.displayName = this.officeName;
        this.courseOfficeLookupTableModal.show();
    }


    setOfficeIdNull() {
        this.course.officeId = null;
        this.officeName = '';
    }


    getNewOfficeId() {
        this.course.officeId = this.courseOfficeLookupTableModal.id;
        this.officeName = this.courseOfficeLookupTableModal.displayName;
    }


    close(): void {
        this.active = false;
        this.modal.hide();
    }
}
