import { Knex } from 'knex';
import moment from 'moment';

export class IsUserModel {

  list(knex: Knex, id: number) {
    if (id > 0) {
      return knex('is_user')
        .where({ id })
        .orderBy('fname');
    } else {
      return knex('is_user')
        .orderBy('fname');
    }
  }

  selectSql(knex: Knex, tableName: string, selectText: string, whereText: string, groupBy: string, orderBy: string) {
    let query = knex(tableName).select(knex.raw(selectText));
    if (whereText != '') {
      query = query.whereRaw(whereText);
    }
    if (groupBy != '') {
      query = query.groupByRaw(groupBy);
    }
    if (orderBy != '') {
      query = query.orderByRaw(orderBy);
    }
    return query.limit(500);
  }

  getByID(knex: Knex, userID: number) {
    return knex('is_user')
      .where('id', userID)
      .orderBy('fname', 'lname');
  }

  getByUserName(knex: Knex, userName: string) {
    return knex('is_user').select('*')
      .where('username', userName)
      .orderBy('fname', 'lname');
  }

  getByName(db: Knex, typeSearch: string, valSearch: string, HospCode: string) {
    const column = typeSearch === "fname" ? 'fname' : 'lname';
    let query = db('is_user').select('*').
      where(column, 'LIKE', valSearch + '%');
    return query.orderBy('fname', 'lname').limit(50);
  }

  saveUser(knex: Knex, id: number, arrData: any) {
    arrData.updated_at = moment().format('x');
    if (id > 0) {
      return knex('is_user').update(arrData)
        .where('id', '=', id);
    } else {
      arrData.created_at = moment().format('x');
      return knex('is_user').insert(arrData, 'id');
    }
  }

  remove(knex: Knex, id: number) {
    return knex('is_user')
      .where('id', id)
      .del();
  }

}