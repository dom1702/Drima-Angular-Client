import { Component, ViewChild, Injector, Output, EventEmitter, QueryList, ViewChildren, AfterViewInit} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { PricePackagesServiceProxy, CreateOrEditPricePackageDto, ProductsServiceProxy, ProductPricePackageInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { Table } from 'primeng/table';
import { Paginator, LazyLoadEvent } from 'primeng/primeng';
import { Subscription } from 'rxjs';
import { PrimengTableHelper } from '@shared/helpers/PrimengTableHelper';
import { ViewProductModalComponent } from '../products/view-product-modal.component';
import { PricePackageProductLookupTableModalComponent } from './pricePackage-product-lookup-table-modal.component';


@Component({
    selector: 'createOrEditPricePackageModal',
    templateUrl: './create-or-edit-pricePackage-modal.component.html'
})
export class CreateOrEditPricePackageModalComponent extends AppComponentBase implements AfterViewInit  {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('productLookupTableModal') productLookupTableModal: PricePackageProductLookupTableModalComponent;
    @ViewChild('viewProductModal') viewProductModal: ViewProductModalComponent;
    @ViewChildren('dataTableProducts') dataTableList: QueryList<Table>;
    @ViewChildren('paginatorProducts') paginatorList: QueryList<Paginator>;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    dataTable : Table;
    paginator : Paginator;

    isEdit : boolean;

    pricePackageId;

    pricePackage: CreateOrEditPricePackageDto = new CreateOrEditPricePackageDto();

    primengTableHelper = new PrimengTableHelper();

    private dataTableSubscription : Subscription;
    private paginatorSubscription : Subscription;

    constructor(
        injector: Injector,
        private _pricePackagesServiceProxy: PricePackagesServiceProxy,
        private _productServiceProxy: ProductsServiceProxy
    ) {
        super(injector);
    }

    ngAfterViewInit()
    {
        this.dataTableSubscription = this.dataTableList.changes.subscribe((comps: QueryList<Table>) =>
        { 
            this.dataTable = comps.first;
             if(this.paginator != null)
                 this.updateProducts();

                 this.dataTableSubscription.unsubscribe();
        });

        this.paginatorSubscription = this.paginatorList.changes.subscribe((comps: QueryList<Paginator>) =>
        {
            this.paginator = comps.first;
             if(this.dataTable != null)
                 this.updateProducts();

                 this.paginatorSubscription.unsubscribe();
        });
    }


    show(pricePackageId?: number): void {

        if (!pricePackageId) {
            this.pricePackage = new CreateOrEditPricePackageDto();
            //this.pricePackage.id = pricePackageId;

            this.isEdit = false;

            this.active = true;
            this.modal.show();
        } else {
            this._pricePackagesServiceProxy.getPricePackageForEdit(pricePackageId).subscribe(result => {
                this.pricePackage = result.pricePackage;

                this.pricePackageId = pricePackageId;

                this.isEdit = true;

                this.active = true;
                this.modal.show();
            });
        }
    }

    updateProducts(event?: LazyLoadEvent): void
    {
        if(this.dataTable == null || this.paginator == null)
            return;

        this._pricePackagesServiceProxy.getAllProductsOfPricePackage(
            this.pricePackageId,
            this.primengTableHelper.getSorting(this.dataTable),
            this.primengTableHelper.getSkipCount(this.paginator, event),
            this.primengTableHelper.getMaxResultCount(this.paginator, event)
        ).subscribe(result => {
            this.primengTableHelper.totalRecordsCount = result.totalCount;
            this.primengTableHelper.records = result.items;
            this.primengTableHelper.hideLoadingIndicator();
        });
    }

    deleteProductFromPricePackage(studentId : number) : void
    {
        this.message.confirm(
            '',
            (isConfirmed) => {
                if (isConfirmed) {
                    this._pricePackagesServiceProxy.deleteProductFromPricePackage(studentId, this.pricePackageId)
                        .subscribe(() => {
                            this.updateProducts();
                            this.reloadPage();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }

    save(): void {
        this.saving = true;
        
        this._pricePackagesServiceProxy.createOrEdit(this.pricePackage)
            .pipe(finalize(() => { this.saving = false;}))
            .subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
            this.close();
            this.modalSave.emit(null);
            });
    }


    openSelectProductModal() 
    {
      this.productLookupTableModal.id = this.pricePackageId;
      this.productLookupTableModal.show(this.pricePackageId);
    }

    openProductViewModal(id : number)
    {
        this._productServiceProxy.getProductForView(id)
        .subscribe(result => {
            this.viewProductModal.show(result);
        });
    }

    getNewProductId() 
    {
        if(this.productLookupTableModal.id == -1)
            return;

        let input : ProductPricePackageInput = new ProductPricePackageInput();
        input.productId = this.productLookupTableModal.id;
        input.pricePackageId = this.pricePackageId;

        this._pricePackagesServiceProxy.addProductToPricePackage(input)
            .subscribe(() => {
                this.updateProducts();
                this.reloadPage();
                this.notify.success(this.l('SavedSuccessfully'));
            });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    close(): void {

        this.active = false;
        this.modal.hide();
    }
}
