import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { View, EventSettingsModel, DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService, ScheduleComponent, PopupOpenEventArgs, CellClickEventArgs, EventClickArgs } from '@syncfusion/ej2-angular-schedule';
import { AppointmentsServiceProxy } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { CreateOrEditDrivingLessonModalComponent } from '../lessons/drivingLessons/create-or-edit-drivingLesson-modal.component';
import { CreateEventTypeModalComponent } from './create-event-type-modal.component';
import { CreateOrEditTheoryLessonModalComponent } from '../lessons/theoryLessons/create-or-edit-theoryLesson-modal.component';
import { CreateOrEditEventModalComponent } from './create-or-edit-event-modal.component';


@Component({
    providers: [DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService],
    templateUrl: './scheduler.component.html',
    animations: [appModuleAnimation()]
})
export class SchedulerComponent extends AppComponentBase implements OnInit {

    @ViewChild('scheduleObj')
    scheduleObj: ScheduleComponent;

    @ViewChild('createOrEditDrivingLessonModal') 
    createOrEditDrivingLessonModal: CreateOrEditDrivingLessonModalComponent;

    @ViewChild('createOrEditTheoryLessonModal') 
    createOrEditTheoryLessonModal: CreateOrEditTheoryLessonModalComponent;

    @ViewChild('createOrEditEventModal') 
    createOrEditEventModal: CreateOrEditEventModalComponent;

    @ViewChild('createEventTypeModal') 
    createEventTypeModal: CreateEventTypeModalComponent;
    

    startTime : Date;

 
    //public data: object[] = [];
    public data: object[] = [{
        Id: 2,
        Subject: 'Meeting',
        StartTime: new Date(2019, 7, 2, 10, 0),
        EndTime: new Date(2019, 7, 2, 12, 30),
        IsAllDay: false,
        AppointmentType: -1
    }];

      public eventSettings: EventSettingsModel = {
        dataSource: this.data
      }

      public currentView: View = 'Day';

    constructor(
        injector: Injector,
        private _appointmentsServiceProxy: AppointmentsServiceProxy
    ) {
        super(injector);
    }    

    ngOnInit(): void {
        this._appointmentsServiceProxy.getAll(
            moment().startOf('day'),
            moment().startOf('day')).subscribe(result => {

       
                for (var item of result.items)
                {
                    this.data.push(
                    {
                        Id: item.id,
                        Subject: item.subject,
                        StartTime: item.startTime.toDate(),
                        EndTime: item.endTime.toDate(),
                        AppointmentType: item.appointmentType.toString()
                    });
                }
                //this.data = result.items;
                // this.eventSettings.dataSource[0].StartTime = result.items[0].startTime.toDate();
                // this.eventSettings.dataSource[0].EndTime = result.items[0].endTime.toDate();
                console.log(result.items[0].startTime);
            });
    }

    onPopupOpen(args: PopupOpenEventArgs): void {
        args.cancel = true;
        //this.createOrEditDrivingLessonModal.show();
        //this.createEventTypeModal.show();
    }

    onCellClick(args: CellClickEventArgs) : void
    {
        console.log(args);
        this.startTime = args.startTime;
        this.createEventTypeModal.show(this);
    }

    onEventClick(args: EventClickArgs) : void
    {
        console.log(args);
        console.log(args.event["Id"]);

        if(args.event["AppointmentType"] == 0)
            this.createOrEditDrivingLessonModal.show(args.event["Id"]);
        else if(args.event["AppointmentType"] == 1)
            this.createOrEditTheoryLessonModal.show(args.event["Id"]);
        else if(args.event["AppointmentType"] == 2)
            this.createOrEditEventModal.show(args.event["Id"]);
    }

    Doubleclick(args: EventClickArgs) : void
    {
        console.log("Yay");
    }

    openDrivingLessonModal(): void
    { 
        this.createEventTypeModal.close();
        this.createOrEditDrivingLessonModal.startTime = this.startTime;
        this.createOrEditDrivingLessonModal.show();
    }

    openTheoryLessonModal(): void
    { 
        this.createEventTypeModal.close();
        this.createOrEditTheoryLessonModal.startTime = this.startTime;
        this.createOrEditTheoryLessonModal.show();
    }

    openEventModal(): void
    { 
        this.createEventTypeModal.close();
        this.createOrEditEventModal.startTime = this.startTime;
        this.createOrEditEventModal.show();
    }

    
}
