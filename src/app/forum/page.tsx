"use client";

import React, { useState } from 'react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Input } from '~/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Textarea } from '~/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import {
    Plus,
    Search,
    MessageCircle,
    Calendar
} from 'lucide-react';

const ForumPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPost, setNewPost] = useState({
        title: '',
        description: '',
        deadline: '',
        category: 'project'
    });
    const userProfile = {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah.chen.2023@smu.edu.sg',
        degree: 'Computer Science',
        year: 'Year 2',
        intro: 'Passionate about AI and machine learning!',
        profilePhoto: '',
        softSkills: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Creativity'],
        hardSkills: ['Python', 'React', 'Machine Learning', 'SQL', 'Git'],
        modules: [
            { id: 1, code: 'CS102', name: 'Data Structures and Algorithms', prof: 'Prof. Smith', classId: 'G1' },
            { id: 2, code: 'IS112', name: 'Data Management', prof: 'Prof. Johnson', classId: 'G2' },
            { id: 3, code: 'STAT101', name: 'Introduction to Statistics', prof: 'Prof. Wilson', classId: 'G3' }
        ],
        interests: ['AI/ML', 'Web Development', 'Data Science'],
        ccas: ['SMU Coding Club', 'Debate Society'],
        socials: {
            telegram: '@sarahchen',
            instagram: '@sarah_codes',
            linkedin: 'linkedin.com/in/sarah-chen',
            email: 'sarah.chen.2023@smu.edu.sg'
        }
    };

    // Mock forum posts
    const [posts, setPosts] = useState([
        {
            id: 1,
            title: 'Looking for React Developer for E-commerce Project',
            description: 'Building a full-stack e-commerce platform for my IS module. Need someone experienced with React and Node.js. Project duration: 4 weeks.',
            author: {
                name: 'Sarah Chen',
                year: 'Year 3',
                avatar: '',
                telegram: '@sarahchen'
            },
            category: 'project',
            deadline: '2025-02-15',
            createdAt: '2 hours ago'
        },
        {
            id: 2,
            title: 'Study Group for STAT102 - Statistics',
            description: 'Anyone wants to form a study group for Statistics? We can meet weekly to discuss concepts and practice problems together.',
            author: {
                name: 'Marcus Lim',
                year: 'Year 2',
                avatar: '',
                telegram: '@marcuslim'
            },
            category: 'study',
            deadline: '',
            createdAt: '5 hours ago'
        },
        {
            id: 3,
            title: 'iOS App Developer Needed for Startup',
            description: 'Working on a social networking app and need an iOS developer to join the team. This is for a real startup, not just a school project!',
            author: {
                name: 'Alex Wong',
                year: 'Year 4',
                avatar: '',
                telegram: '@alexwong'
            },
            category: 'startup',
            deadline: '2025-02-10',
            createdAt: '1 day ago'
        },
        {
            id: 4,
            title: 'Machine Learning Competition Team',
            description: 'Looking for teammates for the upcoming SMU ML competition. Need people with Python and data science experience.',
            author: {
                name: 'Emily Tan',
                year: 'Year 3',
                avatar: '',
                telegram: '@emilytan'
            },
            category: 'competition',
            deadline: '2025-02-05',
            createdAt: '2 days ago'
        }
    ]);

    const handleCreatePost = () => {
        if (newPost.title && newPost.description) {
            const post = {
                id: posts.length + 1,
                ...newPost,
                author: {
                    name: userProfile.name || 'You',
                    year: userProfile.year || 'Year 2',
                    avatar: userProfile.profilePhoto || '',
                    telegram: userProfile.socials?.telegram || '@you'
                },
                createdAt: 'Just now'
            };
            setPosts([post, ...posts]);
            setNewPost({
                title: '',
                description: '',
                deadline: '',
                category: 'project'
            });
            setShowCreatePost(false);
        }
    };

    type Author = {
        id?: string | number;
        name: string;
        avatar?: string;
        telegram: string;
        year?: string | number;
    };

    const generatePresetMessage = (post: { id?: number; title: string; description?: string; author: Author; category?: string; deadline?: string; createdAt?: string; }) => {
        const senderName = userProfile.name || 'CampusConnect User';
        const profileLink = `https://campusconnect.smu.edu.sg/profile/${userProfile.id || '1'}`;

        const message = `Hi ${post.author.name}! 👋

I saw your post about "${post.title}" on CampusConnect and I'm interested in learning more.

Check out my profile: ${profileLink}

Looking forward to connecting!

Best regards,
${senderName}`;

        // Open Telegram with preset message
        const telegramUrl = `https://t.me/${post.author.telegram.replace('@', '')}?text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'project': return 'bg-primary/10 text-primary border-primary/20';
            case 'study': return 'bg-secondary/10 text-secondary border-secondary/20';
            case 'startup': return 'bg-green-500/10 text-green-700 border-green-500/20';
            case 'competition': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const filteredPosts = posts.filter(post => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            post.title.toLowerCase().includes(query) ||
            post.description.toLowerCase().includes(query) ||
            post.category.toLowerCase().includes(query) ||
            post.author.name.toLowerCase().includes(query)
        );
    });

    return (
        <div className="h-full container mx-auto overflow-y-auto safe-area-top">
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-primary">Forum</h1>
                    <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Post
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md mx-auto bg-white">
                            <DialogHeader>
                                <DialogTitle>Create New Post</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {[
                                            { value: 'project', label: 'Project' },
                                            { value: 'study', label: 'Study Group' },
                                            { value: 'startup', label: 'Startup' },
                                            { value: 'competition', label: 'Competition' }
                                        ].map((cat) => (
                                            <Button
                                                key={cat.value}
                                                variant={newPost.category === cat.value ? 'default' : 'outline'}
                                                onClick={() => setNewPost(prev => ({ ...prev, category: cat.value }))}
                                                className={newPost.category === cat.value ? 'text-sm text-white' : 'text-sm'}
                                            >
                                                {cat.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={newPost.title}
                                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="What are you looking for?"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={newPost.description}
                                        onChange={(e) => setNewPost(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe your project or what you need..."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="deadline">Deadline (Optional)</Label>
                                    <Input
                                        id="deadline"
                                        type="date"
                                        value={newPost.deadline}
                                        onChange={(e) => setNewPost(prev => ({ ...prev, deadline: e.target.value }))}
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <Button variant="outline" onClick={() => setShowCreatePost(false)} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreatePost} className="flex-1 bg-primary text-white">
                                        Create Post
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Posts */}
                <div className="space-y-4">
                    {filteredPosts.map((post) => (
                        <Card key={post.id} className="p-5 hover:shadow-md transition-shadow">
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={post.author.avatar} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {post.author.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-primary">{post.author.name}</div>
                                            <div className="text-sm text-muted-foreground">{post.author.year} • {post.createdAt}</div>
                                            <div className="text-sm text-muted-foreground">{post.author.telegram}</div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(post.category)}`}>
                                        {post.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <h3 className="font-medium text-primary mb-2">{post.title}</h3>
                                    <p className="text-muted-foreground mb-3">{post.description}</p>

                                    {/* Deadline */}
                                    {post.deadline && (
                                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Deadline: {new Date(post.deadline).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => generatePresetMessage(post)}
                                        className="bg-primary hover:bg-primary/90 text-white"
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Send Message
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Empty State */}
                {filteredPosts.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-primary mb-2">No posts found</h3>
                        <p className="text-muted-foreground">Try adjusting your search terms</p>
                    </div>
                )}

                {/* Bottom Spacing for Navigation */}
                <div className="h-20"></div>
            </div>
        </div>
    );
};

export default ForumPage;