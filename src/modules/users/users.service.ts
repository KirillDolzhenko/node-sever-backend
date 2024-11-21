import { IConnectionData } from "../../types/modules/common/responses.types";
import { sendData } from "../../utils/sendResponse";
import {
  dbGetUserById,
  dbIsAdminUserById,
  dbUpdateUserById,
} from "../../db/utils/users/users.db";
import {
  ErrorBadRequest,
  ErrorConflict,
  ErrorForbidden,
  ErrorInternalServer,
  ErrorNotFound,
  ErrorUnauthorized,
} from "../../utils/errors";

import bcrypt from "bcrypt";
import {
  schemaDataGet,
  schemaDataPut,
  TDataGet,
  TDataPut,
} from "../../validations/data.validation";

export class UsersService {
  async put(connection: IConnectionData, data: unknown) {
    try {
      let { error } = schemaDataPut.validate(data);
      if (error) {
        console.log(error);
        console.log("FFF");
        ErrorBadRequest(connection.res);
        return;
      }

      let value = data as TDataPut;

      let userUpdated;

      if (value.data.password) {
        const salt = bcrypt.genSaltSync();
        value.data.password = await bcrypt.hash(value.data.password, salt);
      }

      userUpdated = await dbUpdateUserById(value.id, value.data);

      console.log(userUpdated);
      if (!userUpdated) {
        ErrorBadRequest(connection.res);
        return;
      }

      delete userUpdated.password;

      sendData(connection.res, 200, {
        ...userUpdated,
      });
    } catch (error) {
      ErrorInternalServer(connection.res);

      return;
    }
  }

  async get(connection: IConnectionData, data: unknown, urlPathes?: string[]) {
    console.log(connection.req.body);

    try {
      if (!urlPathes) {
        ErrorNotFound(connection.res);
        return;
      }

      const id = Number(urlPathes[0]);

      let { error } = schemaDataGet.validate(data);

      if (error) {
        ErrorBadRequest(connection.res);
        return;
      }

      let value = data as TDataGet;

      if (!(await dbIsAdminUserById(value.id))) {
        ErrorForbidden(connection.res);

        return;
      }

      let user = await dbGetUserById(id);

      if (!user) {
        ErrorNotFound(connection.res);

        return;
      }

      delete user.password;

      sendData(connection.res, 200, {
        ...user,
      });
    } catch (error) {
      ErrorInternalServer(connection.res);

      return;
    }
  }
}