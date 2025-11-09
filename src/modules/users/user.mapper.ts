import { UsersEntity } from 'src/database/entity/users.entity';
import { User } from './users.domain';
const DEFAULT_AVATAR = '/public/default/default-avatar.jpg';
export class UserMapper {
  static toDomain(raw: UsersEntity): User {
    const domainUser = new User();
    if (!raw) {
      return null;
    }
    domainUser.id = raw.id;
    domainUser.name = raw.name;
    domainUser.email = raw.email;
    domainUser.password = raw.password;
    domainUser.role = raw.role;
    domainUser.phone = raw.phone;
    domainUser.address = raw.address;
    domainUser.avatar = raw.avatar;
    domainUser.gender = raw.gender;
    domainUser.birthday = raw.birthday;
    domainUser.isActive = raw.isActive;
    return domainUser;
  }

  static toEntity(domain: User): UsersEntity {
    const entityUser = new UsersEntity();
    if (domain.id && typeof domain.id === 'string') {
      entityUser.id = domain.id;
    }
    entityUser.name = domain.name;
    entityUser.email = domain.email;
    entityUser.password = domain.password;
    entityUser.role = domain.role;
    entityUser.phone = domain.phone;
    entityUser.address = domain.address;
    entityUser.avatar = domain.avatar ?? DEFAULT_AVATAR;
    entityUser.gender = domain.gender;
    entityUser.birthday = domain.birthday;
    entityUser.isActive = domain.isActive ?? true;

    return entityUser;
  }
}
