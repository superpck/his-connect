import * as Knex from 'knex';

export class UserModel {
  getUser(db: Knex) {
    return db('users').select('id', 'username', 'fullname');
  }
}