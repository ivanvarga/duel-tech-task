import { taskSchema, programSchema, userSchema, SourceUser } from '../schemas';

describe('schemas', () => {
  describe('taskSchema', () => {
    describe('engagement metrics transformations', () => {
      it('should transform string numbers to integers for all engagement fields', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'https://example.com/post',
          likes: '123',
          comments: '45',
          shares: '18',
          reach: '9009'
        };

        const result = taskSchema.parse(input);

        expect(result.likes).toBe(123);
        expect(result.comments).toBe(45);
        expect(result.shares).toBe(18);
        expect(result.reach).toBe(9009);
      });

      it('should transform "NaN" string to 0 for all engagement fields', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'https://example.com/post',
          likes: 'NaN',
          comments: 'NaN',
          shares: 'NaN',
          reach: 'NaN'
        };

        const result = taskSchema.parse(input);

        expect(result.likes).toBe(0);
        expect(result.comments).toBe(0);
        expect(result.shares).toBe(0);
        expect(result.reach).toBe(0);
      });

      it('should transform null to 0 for all engagement fields', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'https://example.com/post',
          likes: null,
          comments: null,
          shares: null,
          reach: null
        };

        const result = taskSchema.parse(input);

        expect(result.likes).toBe(0);
        expect(result.comments).toBe(0);
        expect(result.shares).toBe(0);
        expect(result.reach).toBe(0);
      });

      it('should transform negative sentinel values to 0', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'https://example.com/post',
          likes: -1,
          comments: -100,
          shares: -999,
          reach: -1000
        };

        const result = taskSchema.parse(input);

        expect(result.likes).toBe(0);
        expect(result.comments).toBe(0);
        expect(result.shares).toBe(0);
        expect(result.reach).toBe(0);
      });

      it('should preserve valid positive numbers', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'https://example.com/post',
          likes: 500,
          comments: 25,
          shares: 10,
          reach: 5000
        };

        const result = taskSchema.parse(input);

        expect(result.likes).toBe(500);
        expect(result.comments).toBe(25);
        expect(result.shares).toBe(10);
        expect(result.reach).toBe(5000);
      });

      it('should handle invalid string numbers by transforming to 0', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'https://example.com/post',
          likes: 'invalid',
          comments: 'not-a-number',
          shares: 'abc',
          reach: 'xyz'
        };

        const result = taskSchema.parse(input);

        expect(result.likes).toBe(0);
        expect(result.comments).toBe(0);
        expect(result.shares).toBe(0);
        expect(result.reach).toBe(0);
      });
    });

    describe('post_url validation', () => {
      it('should accept valid URLs', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'https://nice-hoof.com/',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        const result = taskSchema.parse(input);

        expect(result.post_url).toBe('https://nice-hoof.com/');
      });

      it('should transform "broken_link" sentinel to null', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'broken_link',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        const result = taskSchema.parse(input);

        expect(result.post_url).toBeNull();
      });

      it('should reject invalid URLs', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'not-a-valid-url',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        expect(() => taskSchema.parse(input)).toThrow();
      });

      it('should accept null post_url', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'broken_link',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        const result = taskSchema.parse(input);

        expect(result.post_url).toBeNull();
      });
    });

    describe('platform validation', () => {
      it('should accept valid platforms', () => {
        const platforms = ['TikTok', 'Instagram', 'Facebook'];

        platforms.forEach(platform => {
          const input = {
            task_id: '550e8400-e29b-41d4-a716-446655440000',
            platform,
            post_url: 'https://example.com',
            likes: 0,
            comments: 0,
            shares: 0,
            reach: 0
          };

          const result = taskSchema.parse(input);
          expect(result.platform).toBe(platform);
        });
      });

      it('should transform number to null for platform', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 123,
          post_url: 'https://example.com',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        const result = taskSchema.parse(input);

        expect(result.platform).toBeNull();
      });

      it('should reject invalid platform names', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Twitter',
          post_url: 'https://example.com',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        expect(() => taskSchema.parse(input)).toThrow();
      });
    });

    describe('task_id validation', () => {
      it('should accept valid UUIDs', () => {
        const input = {
          task_id: '550e8400-e29b-41d4-a716-446655440000',
          platform: 'Instagram',
          post_url: 'https://example.com',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        const result = taskSchema.parse(input);

        expect(result.task_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      });

      it('should accept null task_id', () => {
        const input = {
          task_id: null,
          platform: 'Instagram',
          post_url: 'https://example.com',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        const result = taskSchema.parse(input);

        expect(result.task_id).toBeNull();
      });

      it('should reject invalid UUIDs', () => {
        const input = {
          task_id: 'not-a-uuid',
          platform: 'Instagram',
          post_url: 'https://example.com',
          likes: 0,
          comments: 0,
          shares: 0,
          reach: 0
        };

        expect(() => taskSchema.parse(input)).toThrow();
      });
    });
  });

  describe('programSchema', () => {
    it('should accept valid program data', () => {
      const input = {
        program_id: 'prog-123',
        brand: 'Nike',
        tasks_completed: [],
        total_sales_attributed: 1000
      };

      const result = programSchema.parse(input);

      expect(result.program_id).toBe('prog-123');
      expect(result.brand).toBe('Nike');
      expect(result.tasks_completed).toEqual([]);
      expect(result.total_sales_attributed).toBe(1000);
    });

    it('should transform number to null for brand', () => {
      const input = {
        program_id: 'prog-123',
        brand: 456,
        tasks_completed: [],
        total_sales_attributed: 1000
      };

      const result = programSchema.parse(input);

      expect(result.brand).toBeNull();
    });

    it('should transform "no-data" to 0 for total_sales_attributed', () => {
      const input = {
        program_id: 'prog-123',
        brand: 'Nike',
        tasks_completed: [],
        total_sales_attributed: 'no-data'
      };

      const result = programSchema.parse(input);

      expect(result.total_sales_attributed).toBe(0);
    });

    it('should parse string numbers for total_sales_attributed', () => {
      const input = {
        program_id: 'prog-123',
        brand: 'Nike',
        tasks_completed: [],
        total_sales_attributed: '2500.50'
      };

      const result = programSchema.parse(input);

      expect(result.total_sales_attributed).toBe(2500.50);
    });

    it('should transform invalid string to 0 for total_sales_attributed', () => {
      const input = {
        program_id: 'prog-123',
        brand: 'Nike',
        tasks_completed: [],
        total_sales_attributed: 'invalid'
      };

      const result = programSchema.parse(input);

      expect(result.total_sales_attributed).toBe(0);
    });

    it('should reject empty program_id', () => {
      const input = {
        program_id: '',
        brand: 'Nike',
        tasks_completed: [],
        total_sales_attributed: 1000
      };

      expect(() => programSchema.parse(input)).toThrow();
    });
  });

  describe('userSchema', () => {
    const validUserBase = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'john@example.com',
      instagram_handle: '@johndoe',
      tiktok_handle: '@johndoe_tt',
      joined_at: '2024-01-01T00:00:00Z',
      advocacy_programs: []
    };

    describe('email validation and transformation', () => {
      it('should accept valid emails', () => {
        const input = {
          ...validUserBase,
          email: 'test@example.com'
        };

        const result = userSchema.parse(input);

        expect(result.email).toBe('test@example.com');
      });

      it('should normalize email to lowercase', () => {
        const input = {
          ...validUserBase,
          email: 'TEST@EXAMPLE.COM'
        };

        const result = userSchema.parse(input);

        expect(result.email).toBe('test@example.com');
      });

      it('should trim whitespace from email', () => {
        const input = {
          ...validUserBase,
          email: '  test@example.com  '
        };

        const result = userSchema.parse(input);

        expect(result.email).toBe('test@example.com');
      });

      it('should reject "invalid-email" sentinel', () => {
        const input = {
          ...validUserBase,
          email: 'invalid-email'
        };

        expect(() => userSchema.parse(input)).toThrow();
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'notanemail',
          'missing@domain',
          '@nodomain.com',
          'no-at-sign.com'
        ];

        invalidEmails.forEach(email => {
          const input = {
            ...validUserBase,
            email
          };

          expect(() => userSchema.parse(input)).toThrow();
        });
      });

      it('should accept complex valid email formats', () => {
        const validEmails = [
          'user+tag@example.com',
          'user.name@example.co.uk',
          'user_name@sub.example.com'
        ];

        validEmails.forEach(email => {
          const input = {
            ...validUserBase,
            email
          };

          const result = userSchema.parse(input);
          expect(result.email).toBe(email.toLowerCase());
        });
      });
    });

    describe('social handle normalization', () => {
      it('should remove @ prefix from instagram_handle', () => {
        const input = {
          ...validUserBase,
          instagram_handle: '@johndoe'
        };

        const result = userSchema.parse(input);

        expect(result.instagram_handle).toBe('johndoe');
      });

      it('should convert instagram_handle to lowercase', () => {
        const input = {
          ...validUserBase,
          instagram_handle: '@JOHNDOE'
        };

        const result = userSchema.parse(input);

        expect(result.instagram_handle).toBe('johndoe');
      });

      it('should trim whitespace from instagram_handle', () => {
        const input = {
          ...validUserBase,
          instagram_handle: '  @johndoe  '
        };

        const result = userSchema.parse(input);

        expect(result.instagram_handle).toBe('johndoe');
      });

      it('should handle instagram_handle without @ prefix', () => {
        const input = {
          ...validUserBase,
          instagram_handle: 'johndoe'
        };

        const result = userSchema.parse(input);

        expect(result.instagram_handle).toBe('johndoe');
      });

      it('should transform "#error_handle" to null for tiktok_handle', () => {
        const input = {
          ...validUserBase,
          tiktok_handle: '#error_handle'
        };

        const result = userSchema.parse(input);

        expect(result.tiktok_handle).toBeNull();
      });

      it('should normalize tiktok_handle same as instagram_handle', () => {
        const input = {
          ...validUserBase,
          tiktok_handle: '@TikTokUser'
        };

        const result = userSchema.parse(input);

        expect(result.tiktok_handle).toBe('tiktokuser');
      });
    });

    describe('joined_at transformation', () => {
      it('should parse valid ISO date strings to Date objects', () => {
        const input = {
          ...validUserBase,
          joined_at: '2024-01-01T00:00:00Z'
        };

        const result = userSchema.parse(input) as SourceUser;

        expect(result.joined_at).toBeInstanceOf(Date);
        expect((result.joined_at as Date).toISOString()).toBe('2024-01-01T00:00:00.000Z');
      });

      it('should transform "not-a-date" to null', () => {
        const input = {
          ...validUserBase,
          joined_at: 'not-a-date'
        };

        const result = userSchema.parse(input);

        expect(result.joined_at).toBeNull();
      });
    });

    describe('user_id validation', () => {
      it('should accept valid UUIDs', () => {
        const input = {
          ...validUserBase,
          user_id: '550e8400-e29b-41d4-a716-446655440000'
        };

        const result = userSchema.parse(input);

        expect(result.user_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      });

      it('should reject invalid UUIDs', () => {
        const input = {
          ...validUserBase,
          user_id: 'not-a-uuid'
        };

        expect(() => userSchema.parse(input)).toThrow(/user_id must be a valid UUID/);
      });
    });

    describe('name validation', () => {
      it('should reject empty names', () => {
        const input = {
          ...validUserBase,
          name: ''
        };

        expect(() => userSchema.parse(input)).toThrow(/name is required/);
      });

      it('should reject "???" sentinel', () => {
        const input = {
          ...validUserBase,
          name: '???'
        };

        expect(() => userSchema.parse(input)).toThrow(/name cannot be \?\?\?/);
      });

      it('should accept valid names', () => {
        const input = {
          ...validUserBase,
          name: 'Jane Smith'
        };

        const result = userSchema.parse(input);

        expect(result.name).toBe('Jane Smith');
      });
    });

    describe('cross-field validation', () => {
      it('should require tiktok_handle when user has TikTok tasks', () => {
        const input = {
          ...validUserBase,
          tiktok_handle: null,
          advocacy_programs: [
            {
              program_id: 'prog-1',
              brand: 'Nike',
              tasks_completed: [
                {
                  task_id: '660e8400-e29b-41d4-a716-446655440000',
                  platform: 'TikTok',
                  post_url: 'https://example.com',
                  likes: 100,
                  comments: 10,
                  shares: 5,
                  reach: 1000
                }
              ],
              total_sales_attributed: 500
            }
          ]
        };

        expect(() => userSchema.parse(input)).toThrow(/tiktok_handle is required/);
      });

      it('should require instagram_handle when user has Instagram tasks', () => {
        const input = {
          ...validUserBase,
          instagram_handle: null,
          advocacy_programs: [
            {
              program_id: 'prog-1',
              brand: 'Nike',
              tasks_completed: [
                {
                  task_id: '660e8400-e29b-41d4-a716-446655440000',
                  platform: 'Instagram',
                  post_url: 'https://example.com',
                  likes: 100,
                  comments: 10,
                  shares: 5,
                  reach: 1000
                }
              ],
              total_sales_attributed: 500
            }
          ]
        };

        expect(() => userSchema.parse(input)).toThrow(/instagram_handle is required/);
      });

      it('should not require handles when no tasks match the platform', () => {
        const input = {
          ...validUserBase,
          instagram_handle: null,
          tiktok_handle: null,
          advocacy_programs: [
            {
              program_id: 'prog-1',
              brand: 'Nike',
              tasks_completed: [
                {
                  task_id: '660e8400-e29b-41d4-a716-446655440000',
                  platform: 'Facebook',
                  post_url: 'https://example.com',
                  likes: 100,
                  comments: 10,
                  shares: 5,
                  reach: 1000
                }
              ],
              total_sales_attributed: 500
            }
          ]
        };

        const result = userSchema.parse(input);

        expect(result.instagram_handle).toBeNull();
        expect(result.tiktok_handle).toBeNull();
      });

      it('should allow valid handles when platforms match', () => {
        const input = {
          ...validUserBase,
          instagram_handle: '@johndoe',
          tiktok_handle: '@johndoe_tt',
          advocacy_programs: [
            {
              program_id: 'prog-1',
              brand: 'Nike',
              tasks_completed: [
                {
                  task_id: '660e8400-e29b-41d4-a716-446655440000',
                  platform: 'Instagram',
                  post_url: 'https://example.com',
                  likes: 100,
                  comments: 10,
                  shares: 5,
                  reach: 1000
                },
                {
                  task_id: '770e8400-e29b-41d4-a716-446655440000',
                  platform: 'TikTok',
                  post_url: 'https://example.com',
                  likes: 200,
                  comments: 20,
                  shares: 10,
                  reach: 2000
                }
              ],
              total_sales_attributed: 500
            }
          ]
        };

        const result = userSchema.parse(input);

        expect(result.instagram_handle).toBe('johndoe');
        expect(result.tiktok_handle).toBe('johndoe_tt');
      });
    });

    describe('full integration', () => {
      it('should parse complete valid user with programs and tasks', () => {
        const input = {
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'JOHN@EXAMPLE.COM',
          instagram_handle: '@JohnDoe',
          tiktok_handle: '@JohnDoeTT',
          joined_at: '2024-01-15T10:30:00Z',
          advocacy_programs: [
            {
              program_id: 'prog-1',
              brand: 'Nike',
              tasks_completed: [
                {
                  task_id: '660e8400-e29b-41d4-a716-446655440000',
                  platform: 'Instagram',
                  post_url: 'https://instagram.com/post/123',
                  likes: '500',
                  comments: 'NaN',
                  shares: null,
                  reach: -1000
                }
              ],
              total_sales_attributed: '1500.75'
            }
          ]
        };

        const result = userSchema.parse(input) as SourceUser;

        expect(result.user_id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.name).toBe('John Doe');
        expect(result.email).toBe('john@example.com');
        expect(result.instagram_handle).toBe('johndoe');
        expect(result.tiktok_handle).toBe('johndoett');
        expect(result.joined_at).toBeInstanceOf(Date);
        expect(result.advocacy_programs).toHaveLength(1);
        expect(result.advocacy_programs[0].program_id).toBe('prog-1');
        expect(result.advocacy_programs[0].brand).toBe('Nike');
        expect(result.advocacy_programs[0].total_sales_attributed).toBe(1500.75);
        expect(result.advocacy_programs[0].tasks_completed).toHaveLength(1);
        expect(result.advocacy_programs[0].tasks_completed[0].likes).toBe(500);
        expect(result.advocacy_programs[0].tasks_completed[0].comments).toBe(0);
        expect(result.advocacy_programs[0].tasks_completed[0].shares).toBe(0);
        expect(result.advocacy_programs[0].tasks_completed[0].reach).toBe(0);
      });
    });
  });
});
