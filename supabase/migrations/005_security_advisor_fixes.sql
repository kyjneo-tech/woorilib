-- Security Advisor 경고 해결
-- public.user_profiles 및 public.child_profiles 테이블에 대한 RLS 정책 추가

-- 1. user_profiles 테이블 정책
DO $$
BEGIN
    -- 테이블이 존재하는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        
        -- 기존 정책 삭제 (중복 방지)
        DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

        -- 컬럼 확인: user_id가 있으면 user_id 사용, 아니면 id 사용
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id') THEN
            CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid()::text = user_id::text);
            CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);
            CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
        ELSE
            CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid()::text = id::text);
            CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid()::text = id::text);
            CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid()::text = id::text);
        END IF;
        
        RAISE NOTICE 'Added RLS policies for user_profiles';
    END IF;
END $$;

-- 2. child_profiles 테이블 정책
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'child_profiles') THEN
        
        DROP POLICY IF EXISTS "Users can view own child profiles" ON child_profiles;
        DROP POLICY IF EXISTS "Users can update own child profiles" ON child_profiles;
        DROP POLICY IF EXISTS "Users can delete own child profiles" ON child_profiles;
        DROP POLICY IF EXISTS "Users can insert own child profiles" ON child_profiles;

        -- user_id 컬럼이 있다고 가정 (없으면 에러 발생하겠지만, child_profiles라면 보통 user_id가 있음)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'child_profiles' AND column_name = 'user_id') THEN
            CREATE POLICY "Users can view own child profiles" ON child_profiles FOR SELECT USING (auth.uid()::text = user_id::text);
            CREATE POLICY "Users can update own child profiles" ON child_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);
            CREATE POLICY "Users can delete own child profiles" ON child_profiles FOR DELETE USING (auth.uid()::text = user_id::text);
            CREATE POLICY "Users can insert own child profiles" ON child_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
            RAISE NOTICE 'Added RLS policies for child_profiles';
        ELSE
            RAISE NOTICE 'Skipping child_profiles: user_id column not found';
        END IF;

    END IF;
END $$;
