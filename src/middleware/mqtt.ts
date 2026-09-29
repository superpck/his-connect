import axios from "axios";
import { getReferToken } from './moph-refer';
import dayjs from "dayjs";
import { version } from '../../package.json';

export class Mqtt {
  private token: string | null;

  constructor() { }

  async getCode() {
    try {
      if (!this.token) {
        const result = await getReferToken();
        this.token = result?.token || result || null;
      }
      if (!this.token) {
        return null;
      }
      const url: string = `${process.env.NREFER_API_URL || 'https://nrefer.moph.go.th/api/beta'}`;
      const options = {
        url: `${url}/create-access-code/HIS-CONNECT-MQTT?source=HIS-CONNECT&&version=${version}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token,
          'content-encoding': 'gzip',
        }
      };
      const { status, data } = await axios(options);
      if (data && (data?.statusCode || data?.status)) {
        // console.log(dayjs().format('HH:mm:ss'), 'MQTT initialized with code:', data?.code);
        return data?.code || null;
      } else {
        return null;
      }
    } catch (error) {
      // console.log(dayjs().format('HH:mm:ss'), 'MQTT initialize error:', error?.message || error);
      throw error;
    }
  }

  // mqtt subscribe
  mqttSubscribe = async () => {
    const code = await this.getCode();
    if (!code) {
      // console.error(dayjs().format('HH:mm:ss'), 'MQTT create code error');
      return false;
    }

    try {
      const url = process.env.MQTT_url || 'https://referlink.moph.go.th/api/mqtt';
      const options = {
        url: `${url}/subscribe`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token,
          'content-encoding': 'gzip',
        },
        data: {
          code: code
        }
      };
      const { status, data } = await axios(options);
      if (status === 200) {
        // console.log(dayjs().format('HH:mm:ss'), 'MQTT subscribed successfully');
      } else {
        // console.error(dayjs().format('HH:mm:ss'), 'MQTT subscribe error:', data?.message || data);
      }
    } catch (error) {
      // console.error(dayjs().format('HH:mm:ss'), 'MQTT subscribe exception:', error?.message || error);
    }

  }

}