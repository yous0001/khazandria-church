import { Group, IGroup } from './group.model';
import { HttpError } from '../../utils/httpError';
import { isValidObjectId } from '../../utils/objectId';

export interface CreateGroupDTO {
  activityId: string;
  name: string;
  labels?: string[];
}

export interface UpdateGroupDTO {
  name?: string;
  labels?: string[];
}

export class GroupService {
  async createGroup(dto: CreateGroupDTO): Promise<IGroup> {
    if (!isValidObjectId(dto.activityId)) {
      throw new HttpError(400, 'Invalid activity ID');
    }

    const group = await Group.create({
      activityId: dto.activityId,
      name: dto.name,
      labels: dto.labels ?? [],
    });

    return group;
  }

  async getGroupsByActivity(activityId: string, labelFilter?: string): Promise<IGroup[]> {
    if (!isValidObjectId(activityId)) {
      throw new HttpError(400, 'Invalid activity ID');
    }

    const query: any = { activityId };
    
    if (labelFilter) {
      query.labels = labelFilter;
    }

    return Group.find(query).sort({ name: 1 });
  }

  async getGroupById(groupId: string): Promise<IGroup> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    return group;
  }

  async updateGroup(groupId: string, dto: UpdateGroupDTO): Promise<IGroup> {
    if (!isValidObjectId(groupId)) {
      throw new HttpError(400, 'Invalid group ID');
    }

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $set: dto },
      { new: true, runValidators: true }
    );

    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    return group;
  }
}

export const groupService = new GroupService();





