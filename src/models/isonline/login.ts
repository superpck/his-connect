import { Knex } from 'knex';
import { IisStructure } from '../model';
import * as moment from 'moment';
const dbName = process.env.DB_NAME;

export class IsLoginModel {
  doLogin(db: Knex, username: string, password: string) {
    return db('is_user')
      .leftJoin('lib_hospcode', 'hcode', 'off_id')
      .select('is_user.*', 'lib_hospcode.name as hospname', 'lib_hospcode.changwatcode as hospprov')
      .where({
        username: username,
        sha: password
      })
      .limit(1);
  }

  checkToken(knex: Knex, token) {
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
  /*
    `username` varchar(30) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
    `division` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
    `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
    `tel_office` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
    `tel_mobile` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
    `confirmed_at` bigint(11) DEFAULT NULL,
    `unconfirmed_email` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
    `blocked_at` bigint(11) DEFAULT NULL,
    `verify_at` bigint(11) DEFAULT NULL,
    `expire_at` bigint(11) DEFAULT NULL COMMENT 'วันที่ expire',
    `registration_ip` varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL,
    `created_at` bigint(11) unsigned NOT NULL,
    `updated_at` bigint(11) unsigned NOT NULL,
    `flags` bigint(11) unsigned NOT NULL DEFAULT '0',
    `status` int(2) DEFAULT '10',
    `detail` text COLLATE utf8_unicode_ci,
    `remark` text COLLATE utf8_unicode_ci,
    `create_system` varchar(50) COLLATE utf8_unicode_ci DEFAULT 'ISONLINE',
*/
  saveToken(knex: Knex, tokenInfo) {
    return knex('is_token')
      .insert(tokenInfo);
  }


  /*

  CREATE TABLE `is_token` (
  `ref` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `uid` int(6) NOT NULL,
  `token` varchar(128) NOT NULL,
  `token_request` text,
  `job` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `expire` datetime NOT NULL,
  `type` smallint(6) NOT NULL,
  `lastupdate` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ref`),
  UNIQUE KEY `token` (`token`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  */
}