import * as moment from 'moment';

export const randomString = async (length: number, format = 'AlphaNumeric') => {
  // format AlphaNumeric=String+number, Special=AlphaNumeric+Special characters
  length = Math.max(1, Math.min(1024, length));
  let result = '';
  const characters1 = '@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const characters2 = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ-*^abcdefghijklmnopqrstuvwxyz0123456789!$_';
  const characters = format?.substring(0, 1).toUpperCase() == 'S' ? characters2 : characters1;
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export const isNumeric = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

export const dateLen = async (date1: any, date2: any = moment()) => {
  if (date1 === undefined || date1 === null || date1 === '0000-00-00' || date1 === '0000-00-00 00:00:00' || date1 === 'Invalid Date' ||
    date2 === undefined || date2 === null || date2 === '0000-00-00' || date2 === '0000-00-00 00:00:00' || date2 === 'Invalid Date') {
    return false;
  }
  if (!date1 || !date2) {
    return null;
  }

  date1 = moment(date1);
  date2 = moment(date2);
  const duration: any = moment.duration(moment(date2).diff(moment(date1)));
  return {
    days: Math.floor(duration['_milliseconds'] / 1000 / 60 / 60 / 24),
    year: duration['_data']['years'],
    month: duration['_data']['months'],
    day: duration['_data']['days'],
    hour: duration['_data']['hours'],
    minute: duration['_data']['minutes'],
    second: duration['_data']['seconds']
  }
}

export const thaiDate = (date: any = moment()) => {
  return moment(date).get('date') + '/' + (+moment(date).get('month') + 1) + '/' + (+moment(date).get('year') + 543);
};

export const thaiDateAbbr = (date: any = moment(), withYear = true) => {
  const thaiMonthAbbr = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const nMonth = moment(date).get('month');
  return moment(date).get('date') + ' ' + thaiMonthAbbr[nMonth] +
    (withYear ? (' ' + (+moment(date).get('year') + 543)) : '');
};

export const thaiDateFull = (date = moment(), withYear = true) => {
  const txtMonth = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม', 'กรุณาเลือกเดือน'];
  const thDow = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const nMonth = moment(date).get('month');
  return 'วัน' + thDow[+moment(date).format('d') - 1] + ' ที่ ' + moment(date).get('date') + ' ' + txtMonth[nMonth] +
    (withYear ? (' พ.ศ.' + (+moment(date).get('year') + 543)) : '');
};

export const timeMinute = (date = moment()) => {
  return moment(date).format('HH:mm');
};

export const timeSecond = (date = moment()) => {
  return moment(date).format('HH:mm:ss');
};
