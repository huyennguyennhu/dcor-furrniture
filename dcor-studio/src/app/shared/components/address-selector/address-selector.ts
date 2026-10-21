import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  MapPin, 
  Plus, 
  Check, 
  ChevronRight, 
  X, 
  ShoppingBag, 
  Search 
} from 'lucide-angular';
import { ALL_VIETNAM_PROVINCE_NAMES, getWardsForProvince } from '../../data/vietnam-administrative.data';
import { environment } from '../../../../environments/environment';

export interface AddressInfo {
  id?: string;
  receiverName: string;
  phone: string;
  email?: string;
  address: string;
  province?: string;
  district?: string;
  ward?: string;
  detail?: string;
  isDefault?: boolean;
  isPhoneVerified?: boolean;
}

@Component({
  selector: 'app-address-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './address-selector.html',
  styleUrls: ['./address-selector.css']
})
export class AddressSelectorComponent implements OnInit, OnChanges {
  @Input() receiverName = '';
  @Input() phone = '';
  @Input() email = '';
  @Input() address = '';
  @Input() isPhoneVerified = false;
  @Input() showEmail = true;
  @Input() cardTitle = 'Địa chỉ nhận hàng';

  @Output() addressChange = new EventEmitter<AddressInfo>();
  @Output() requestVerifyPhone = new EventEmitter<string>();

  icons = {
    MapPin,
    Plus,
    Check,
    ChevronRight,
    X,
    ShoppingBag,
    Search
  };

  isAddressModalOpen = false;
  addressModalMode: 'select' | 'add' = 'select';

  isLoggedIn = false;
  hasUserPhone = false;
  currentUser: any = null;

  savedAddresses: AddressInfo[] = [];
  selectedAddressId = '';

  // Guest lookup
  guestPhoneLookup = '';
  isLookingUpAddress = false;
  guestFoundAddresses: AddressInfo[] = [];
  guestLookupMessage = '';

  // Form thêm địa chỉ mới
  provinces: string[] = ALL_VIETNAM_PROVINCE_NAMES;
  wards: string[] = [];

  newAddress: {
    receiverName: string;
    phone: string;
    email?: string;
    province: string;
    district?: string;
    ward: string;
    detail: string;
    isDefault?: boolean;
  } = {
    receiverName: '',
    phone: '',
    email: '',
    province: 'Thành phố Hồ Chí Minh',
    district: '',
    ward: '',
    detail: '',
    isDefault: false
  };

  newAddressError = '';
  isSavingNewAddress = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.checkUserAuth();
    this.initAdministrativeData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['phone'] && !changes['phone'].isFirstChange()) {
      if (this.phone && !this.guestPhoneLookup) {
        this.guestPhoneLookup = this.phone;
      }
    }
  }

  get hasSelectedAddress(): boolean {
    return Boolean(this.address && this.address.trim().length > 0);
  }

  checkUserAuth() {
    if (typeof localStorage === 'undefined') return;
    const token = localStorage.getItem('dcor_customer_token');
    const storedUser = localStorage.getItem('dcor_customer') || localStorage.getItem('dcor_customer_user') || localStorage.getItem('dcor_user');

    if (token && storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.isLoggedIn = true;
        this.hasUserPhone = Boolean(this.currentUser.phone && this.currentUser.phone.trim().length > 0);

        if (Array.isArray(this.currentUser.addresses) && this.currentUser.addresses.length > 0) {
          this.savedAddresses = this.currentUser.addresses.map((a: any, idx: number) => ({
            id: a.id || `addr-${idx}`,
            receiverName: a.receiverName || this.currentUser.fullName || this.currentUser.name || '',
            phone: a.phone || this.currentUser.phone || '',
            email: a.email || this.currentUser.email || '',
            address: a.detail ? `${a.detail}, ${a.ward || ''}, ${a.province || ''}` : (a.address || ''),
            province: a.province,
            ward: a.ward,
            detail: a.detail,
            isDefault: !!a.isDefault
          }));
        } else if (this.currentUser.address) {
          this.savedAddresses = [{
            id: 'addr-profile',
            receiverName: this.currentUser.fullName || this.currentUser.name || '',
            phone: this.currentUser.phone || '',
            email: this.currentUser.email || '',
            address: this.currentUser.address,
            isDefault: true
          }];
        }

        if (this.hasUserPhone) {
          this.loadAddressesFromOrders(this.currentUser.phone);
        }
      } catch {
        this.isLoggedIn = false;
      }
    } else {
      this.isLoggedIn = false;
      this.hasUserPhone = false;
      // Load guest addresses cached in localStorage
      try {
        const localGuest = JSON.parse(localStorage.getItem('dcor_guest_addresses') || '[]');
        if (Array.isArray(localGuest) && localGuest.length > 0) {
          this.savedAddresses = localGuest;
        }
      } catch {}
    }
  }

  initAdministrativeData() {
    if (!this.provinces || this.provinces.length === 0) {
      this.provinces = ['Thành phố Hồ Chí Minh', 'Thành phố Hà Nội', 'Thành phố Đà Nẵng'];
    }
    this.updateWardsForProvince(this.newAddress.province);
  }

  updateWardsForProvince(prov: string) {
    this.wards = getWardsForProvince(prov) || [];
    if (this.wards.length > 0 && (!this.newAddress.ward || !this.wards.includes(this.newAddress.ward))) {
      this.newAddress.ward = this.wards[0];
    }
  }

  onProvinceChange() {
    this.updateWardsForProvince(this.newAddress.province);
  }

  openAddressModal(mode: 'select' | 'add' = 'select') {
    this.newAddressError = '';
    this.guestLookupMessage = '';
    this.initNewAddressForm();

    if (this.isLoggedIn && this.hasUserPhone && this.savedAddresses.length > 0) {
      this.addressModalMode = mode;
    } else if (this.savedAddresses.length > 0) {
      this.addressModalMode = mode;
    } else {
      this.addressModalMode = 'add';
    }

    if (this.phone) {
      this.guestPhoneLookup = this.phone;
    }

    this.isAddressModalOpen = true;
    this.cdr.detectChanges();
  }

  closeAddressModal() {
    this.isAddressModalOpen = false;
  }

  initNewAddressForm() {
    this.newAddress = {
      receiverName: this.receiverName || (this.currentUser?.fullName || ''),
      phone: this.phone || (this.currentUser?.phone || ''),
      email: this.email || (this.currentUser?.email || ''),
      province: this.newAddress.province || 'Thành phố Hồ Chí Minh',
      district: '',
      ward: '',
      detail: '',
      isDefault: false
    };
    this.updateWardsForProvince(this.newAddress.province);
  }

  selectAddress(addr: AddressInfo) {
    this.selectedAddressId = addr.id || '';
    this.addressChange.emit({
      id: addr.id,
      receiverName: addr.receiverName,
      phone: addr.phone,
      email: addr.email,
      address: addr.address,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      detail: addr.detail,
      isDefault: addr.isDefault,
      isPhoneVerified: addr.phone === this.phone ? this.isPhoneVerified : false
    });
    this.isAddressModalOpen = false;
    this.cdr.detectChanges();
  }

  lookupGuestAddress() {
    const raw = (this.guestPhoneLookup || '').trim();
    if (!raw) {
      this.guestLookupMessage = 'Vui lòng nhập số điện thoại để tra cứu.';
      this.guestFoundAddresses = [];
      return;
    }

    this.isLookingUpAddress = true;
    this.guestLookupMessage = '';

    fetch(`${environment.apiUrl}/store/orders/by-phone?phone=${encodeURIComponent(raw)}`)
      .then(res => res.json())
      .then((data: any) => {
        const orders = Array.isArray(data) ? data : (data?.orders || []);
        if (orders.length > 0) {
          const uniqueMap = new Map<string, AddressInfo>();
          orders.forEach((o: any, idx: number) => {
            if (o.address) {
              const full = o.address;
              if (!uniqueMap.has(full)) {
                uniqueMap.set(full, {
                  id: `order-addr-${idx}`,
                  receiverName: o.receiverName || raw,
                  phone: o.phone || raw,
                  email: o.email || '',
                  address: full
                });
              }
            }
          });
          this.guestFoundAddresses = Array.from(uniqueMap.values());
        } else {
          this.guestFoundAddresses = [];
          this.guestLookupMessage = 'Chưa tìm thấy địa chỉ nào gắn với số điện thoại này.';
        }
      })
      .catch(() => {
        // Fallback local addresses if network fails
        try {
          const localGuest = JSON.parse(localStorage.getItem('dcor_guest_addresses') || '[]');
          this.guestFoundAddresses = (localGuest as AddressInfo[]).filter(a => a.phone && a.phone.includes(raw));
          if (this.guestFoundAddresses.length === 0) {
            this.guestLookupMessage = 'Chưa tìm thấy địa chỉ nào gắn với số điện thoại này.';
          }
        } catch {
          this.guestFoundAddresses = [];
          this.guestLookupMessage = 'Không thể tra cứu vào lúc này. Vui lòng bấm "+ Thêm địa chỉ mới".';
        }
      })
      .finally(() => {
        this.isLookingUpAddress = false;
        this.cdr.detectChanges();
      });
  }

  loadAddressesFromOrders(phoneStr: string) {
    if (!phoneStr) return;
    fetch(`${environment.apiUrl}/store/orders/by-phone?phone=${encodeURIComponent(phoneStr.trim())}`)
      .then(res => res.json())
      .then((data: any) => {
        const orders = Array.isArray(data) ? data : (data?.orders || []);
        if (orders.length > 0) {
          const existingAddresses = new Set(this.savedAddresses.map(a => a.address.trim().toLowerCase()));
          orders.forEach((o: any, idx: number) => {
            if (o.address && !existingAddresses.has(o.address.trim().toLowerCase())) {
              this.savedAddresses.push({
                id: `history-addr-${idx}`,
                receiverName: o.receiverName || this.currentUser?.fullName || '',
                phone: o.phone || phoneStr,
                email: o.email || this.currentUser?.email || '',
                address: o.address
              });
              existingAddresses.add(o.address.trim().toLowerCase());
            }
          });
          this.cdr.detectChanges();
        }
      })
      .catch(() => {});
  }

  submitNewAddress() {
    this.newAddressError = '';
    const name = (this.newAddress.receiverName || '').trim();
    const phone = (this.newAddress.phone || '').trim();
    const prov = (this.newAddress.province || '').trim();
    const ward = (this.newAddress.ward || '').trim();
    const detail = (this.newAddress.detail || '').trim();

    if (!name) {
      this.newAddressError = 'Vui lòng nhập Họ và tên người nhận.';
      return;
    }
    if (!phone) {
      this.newAddressError = 'Vui lòng nhập Số điện thoại người nhận.';
      return;
    }
    if (!detail) {
      this.newAddressError = 'Vui lòng nhập Số nhà, tên đường cụ thể.';
      return;
    }

    const fullAddr = `${detail}, ${ward ? ward + ', ' : ''}${prov}`;
    const newAddrItem: AddressInfo = {
      id: `addr-${Date.now()}`,
      receiverName: name,
      phone: phone,
      email: this.newAddress.email ? this.newAddress.email.trim() : undefined,
      address: fullAddr,
      province: prov,
      ward: ward,
      detail: detail,
      isDefault: !!this.newAddress.isDefault,
      isPhoneVerified: this.isPhoneVerified
    };

    // Save locally
    try {
      const localGuestAddrs: AddressInfo[] = JSON.parse(localStorage.getItem('dcor_guest_addresses') || '[]');
      localGuestAddrs.unshift(newAddrItem);
      localStorage.setItem('dcor_guest_addresses', JSON.stringify(localGuestAddrs.slice(0, 10)));
    } catch {}

    this.savedAddresses.unshift(newAddrItem);
    this.selectAddress(newAddrItem);
  }

  onVerifyClick(e: Event) {
    e.stopPropagation();
    this.requestVerifyPhone.emit(this.phone);
  }
}
