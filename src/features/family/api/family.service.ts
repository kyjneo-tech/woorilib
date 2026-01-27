import { createBrowserClient } from '@/shared/lib/supabase/client';
import { Child, CreateChildDto, UpdateChildDto, DEFAULT_AVATAR } from '../model/types';

/**
 * 가족(자녀) 관리 API 서비스
 */
class FamilyService {
  private getSupabase() {
    return createBrowserClient();
  }

  /**
   * 현재 사용자의 자녀 목록 조회
   */
  async getChildren(): Promise<Child[]> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', user.id)
      .order('birth_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToChild);
  }

  /**
   * 자녀 추가
   */
  async addChild(dto: CreateChildDto): Promise<Child> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    const { data, error } = await supabase
      .from('children')
      .insert({
        user_id: user.id,
        name: dto.name,
        birth_date: dto.birthDate,
        avatar: dto.avatar || DEFAULT_AVATAR,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToChild(data);
  }

  /**
   * 자녀 정보 수정
   */
  async updateChild(id: string, dto: UpdateChildDto): Promise<Child> {
    const supabase = this.getSupabase();

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.birthDate) updateData.birth_date = dto.birthDate;
    if (dto.avatar) updateData.avatar = dto.avatar;

    const { data, error } = await supabase
      .from('children')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToChild(data);
  }

  /**
   * 자녀 삭제
   */
  async removeChild(id: string): Promise<void> {
    const supabase = this.getSupabase();

    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * DB 응답을 Child 타입으로 변환
   */
  private mapToChild(data: any): Child {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      birthDate: data.birth_date,
      avatar: data.avatar || DEFAULT_AVATAR,
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
    };
  }
}

export const familyService = new FamilyService();
