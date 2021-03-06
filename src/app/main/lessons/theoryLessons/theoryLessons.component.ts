import { Component, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TheoryLessonsServiceProxy, TheoryLessonDto  } from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TokenAuthServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateOrEditTheoryLessonModalComponent } from './create-or-edit-theoryLesson-modal.component';
import { ViewTheoryLessonModalComponent } from './view-theoryLesson-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/components/table/table';
import { Paginator } from 'primeng/components/paginator/paginator';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { FileDownloadService } from '@shared/utils/file-download.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { EditStudentsTheoryLessonModalComponent } from './edit-students-theoryLesson-modal.component';

@Component({
    templateUrl: './theoryLessons.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class TheoryLessonsComponent extends AppComponentBase {

    @ViewChild('createOrEditTheoryLessonModal') createOrEditTheoryLessonModal: CreateOrEditTheoryLessonModalComponent;
    @ViewChild('viewTheoryLessonModalComponent') viewTheoryLessonModal: ViewTheoryLessonModalComponent;
    @ViewChild('editStudentsTableModal') editStudentsTableModal: EditStudentsTheoryLessonModalComponent;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    advancedFiltersAreShown = false;
    filterText = '';
    maxLessonLengthFilter : number;
		maxLessonLengthFilterEmpty : number;
		minLessonLengthFilter : number;
		minLessonLengthFilterEmpty : number;
    maxStartTimeFilter : moment.Moment;
		minStartTimeFilter : moment.Moment;
    maxAddingMinutesAfterFilter : number;
		maxAddingMinutesAfterFilterEmpty : number;
		minAddingMinutesAfterFilter : number;
		minAddingMinutesAfterFilterEmpty : number;
    instructorFilter = '';
    officeFilter = '';
    topicFilter = '';
    completedFilter = -1;
        licenseClassClassFilter = '';
        studentFirstNameFilter = '';
        instructorFirstNameFilter = '';




    constructor(
        injector: Injector,
        private _theoryLessonsServiceProxy: TheoryLessonsServiceProxy,
        private _notifyService: NotifyService,
        private _tokenAuth: TokenAuthServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _fileDownloadService: FileDownloadService
    ) {
        super(injector);
    }e

    getTheoryLessons(event?: LazyLoadEvent) 
    {
        // Test comment here

        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;
        }
       // console.log(this.createOrEditTheoryLessonModal);
        this.primengTableHelper.showLoadingIndicator();

        this._theoryLessonsServiceProxy.getAll(
            this.filterText,
            this.maxLessonLengthFilter == null ? this.maxLessonLengthFilterEmpty: this.maxLessonLengthFilter,
            this.minLessonLengthFilter == null ? this.minLessonLengthFilterEmpty: this.minLessonLengthFilter,
            this.maxStartTimeFilter,
            this.minStartTimeFilter,
            this.maxAddingMinutesAfterFilter == null ? this.maxAddingMinutesAfterFilterEmpty: this.maxAddingMinutesAfterFilter,
            this.minAddingMinutesAfterFilter == null ? this.minAddingMinutesAfterFilterEmpty: this.minAddingMinutesAfterFilter,
            this.instructorFilter,
            this.officeFilter,
            this.topicFilter,
            this.completedFilter,
            this.licenseClassClassFilter,
            this.studentFirstNameFilter,
            this.instructorFirstNameFilter,
            this.primengTableHelper.getSorting(this.dataTable),
            this.primengTableHelper.getSkipCount(this.paginator, event),
            this.primengTableHelper.getMaxResultCount(this.paginator, event)
        ).subscribe(result => {
            this.primengTableHelper.totalRecordsCount = result.totalCount;
            this.primengTableHelper.records = result.items;
            this.primengTableHelper.hideLoadingIndicator();
        });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    createTheoryLesson(): void {
        this.createOrEditTheoryLessonModal.show();
    }

    deleteTheoryLesson(theoryLesson: TheoryLessonDto): void {
        this.message.confirm(
            '',
            (isConfirmed) => {
                if (isConfirmed) {
                    this._theoryLessonsServiceProxy.delete(theoryLesson.id)
                        .subscribe(() => {
                            this.reloadPage();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }

    editStudentsList(theoryLesson: TheoryLessonDto): void {
        this.editStudentsTableModal.show(theoryLesson);
    }

    exportToExcel(): void {
        this._theoryLessonsServiceProxy.getTheoryLessonsToExcel(
        this.filterText,
            this.maxLessonLengthFilter == null ? this.maxLessonLengthFilterEmpty: this.maxLessonLengthFilter,
            this.minLessonLengthFilter == null ? this.minLessonLengthFilterEmpty: this.minLessonLengthFilter,
            this.maxStartTimeFilter,
            this.minStartTimeFilter,
            this.maxAddingMinutesAfterFilter == null ? this.maxAddingMinutesAfterFilterEmpty: this.maxAddingMinutesAfterFilter,
            this.minAddingMinutesAfterFilter == null ? this.minAddingMinutesAfterFilterEmpty: this.minAddingMinutesAfterFilter,
            this.instructorFilter,
            this.officeFilter,
            this.topicFilter,
            this.completedFilter,
            this.licenseClassClassFilter,
            this.studentFirstNameFilter,
            this.instructorFirstNameFilter,
        )
        .subscribe(result => {
            this._fileDownloadService.downloadTempFile(result);
         });
    }
}
