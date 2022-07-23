import Knex = require('knex');
import * as moment from 'moment';

export class IsUserModel {

    list(knex: Knex, id: number) {
        if (id > 0) {
            console.log(knex('is_user')
                .where('id','=',id)   
                .orderBy('fname')
                .toString());
            return knex('is_user')
                .where('id','=',id)   
                .orderBy('fname');
        } else {
            console.log(knex('is_user')
                .orderBy('fname')
                .toString());
            return knex('is_user')
                .orderBy('fname');
        }
    }

  selectSql(knex: Knex, tableName: string, selectText: string, whereText: string, groupBy: string, orderBy: string) {
      let sql = 'select ' + selectText + ' from ' + tableName;
      if (whereText != '')
      {
          sql = sql+' where ' + whereText;
      }
      if (groupBy != '')
      {
          sql = sql+' group by ' + groupBy;
      }    
      if (orderBy != '')
      {
          sql = sql+' order by ' + orderBy;
      }    
      sql = sql + ' limit 0,500';
      console.log(sql);
      return knex.raw(sql);
  }

  getByID(knex: Knex, userID: number) {
    return knex
      .select('*')
      .from('is_user')
      .where('id',userID)
      .orderBy('fname','lname');
  }

  getByUserName(knex: Knex, userName: string) {
    return knex
      .select('*')
      .from('is_user')
      .where('username',userName)
      .orderBy('fname','lname');
  }

  getByName(knex: Knex, typeSearch: string, valSearch: string, HospCode: string) {
    let sql: string;
    if (typeSearch == "fname"){
      sql = 'select * from is_user where fname like "'+valSearch+'%" order by fname,lname limit 0,50';
    } else {
      sql = 'select * from is_user where lname like "'+valSearch+'%" order by fname,lname limit 0,50';
    }
    return knex.raw(sql);
  }

  saveUser(knex: Knex, id: number, arrData: any) {
    if (id > 0) {
        return knex('is_user').update(arrData)
            .where('id', '=', id);
    } else {
        return knex('is_user').insert(arrData, 'id');
    }
  }

  remove(knex: Knex, id: number) {
    return knex('is_user')
      .where('id', id)
      .del();
  }

}