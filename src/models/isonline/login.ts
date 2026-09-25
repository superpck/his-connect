import { Knex } from 'knex';
import moment from 'moment';

export class IsLoginModel {
  checkToken(knex: Knex, token: string) {
    let today = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
    return knex('is_token as token')
      .leftJoin('is_user as user', 'token.uid', 'user.id')
      .select('user.id as uid', 'token.token', 'token.created_at', 'token.expire',
        'token.type', 'user.hcode',
        'user.prename', 'user.fname',
        'user.lname', 'user.position', 'user.position_level',
        'user.user_level', 'user.department')
      .where('token', '=', token)
      .where('expire', '>', today);
  }
  saveToken(knex: Knex, tokenInfo: any) {
    return knex('is_token')
      .insert(tokenInfo);
  }
}