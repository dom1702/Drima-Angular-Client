import { Component, ViewChild, Injector, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { GetProductForViewDto, ProductDto , ProductType} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'viewProductModal',
    templateUrl: './view-product-modal.component.html'
})
export class ViewProductModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    item: GetProductForViewDto;
    productType = ProductType;


    constructor(
        injector: Injector
    ) {
        super(injector);
        this.item = new GetProductForViewDto();
        this.item.product = new ProductDto();
    }

    show(item: GetProductForViewDto): void {
        this.item = item;
        this.active = true;
        this.modal.show();
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }
}
