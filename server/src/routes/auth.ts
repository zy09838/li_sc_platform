import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const JWT_OPTIONS: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
};

// POST /api/auth/register - 注册新用户
router.post('/register', async (req, res) => {
    try {
        const { employeeId, name, email, password, department } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { employeeId },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '工号或邮箱已被注册'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                employeeId,
                name,
                email,
                password: hashedPassword,
                department,
                avatarUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/100/100`
            },
            select: {
                id: true,
                employeeId: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
                role: true,
                points: true,
                createdAt: true
            }
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            JWT_OPTIONS
        );

        res.status(201).json({
            success: true,
            data: { user, token }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: '注册失败' });
    }
});

// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { employeeId }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '工号或密码错误'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '工号或密码错误'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            JWT_OPTIONS
        );

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: '登录失败' });
    }
});

// POST /api/auth/logout - 用户登出
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
    // JWT is stateless, logout is handled on client side
    res.json({ success: true, message: '登出成功' });
});

// GET /api/auth/me - 获取当前用户信息
router.get('/me', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                employeeId: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
                role: true,
                points: true,
                createdAt: true,
                _count: {
                    select: {
                        articles: true,
                        comments: true,
                        articleLikes: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: '获取用户信息失败' });
    }
});

export default router;
