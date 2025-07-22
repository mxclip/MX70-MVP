/**
 * Mock API service for MX70 frontend development
 * Simulates all backend endpoints with realistic data for MVP testing
 */

// Mock data storage
let mockUsers = [
  {
    id: 1,
    email: "business@example.com",
    role: "business_local",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    email: "clipper@example.com", 
    role: "clipper",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z"
  }
];

let mockGigs = [
  {
    id: 1,
    business_id: 1,
    budget: 150,
    goals: "1k views",
    story_type: "morning rush",
    raw_footage_url: null,
    status: "pending",
    created_at: "2024-01-15T08:00:00Z"
  },
  {
    id: 2,
    business_id: 1,
    budget: 200,
    goals: "100 likes",
    story_type: "lunch specials",
    raw_footage_url: "https://example.com/raw-video.mp4",
    status: "claimed",
    created_at: "2024-01-16T10:00:00Z"
  }
];

let mockSubmissions = [
  {
    id: 1,
    gig_id: 2,
    clipper_id: 2,
    edited_video_url: "https://example.com/edited-video.mp4",
    social_post_link: "https://instagram.com/p/example",
    views: 1500,
    likes: 120,
    outcomes: 5,
    bonus: 45.50,
    approved: true,
    created_at: "2024-01-17T14:00:00Z"
  }
];

let mockLessons = [
  {
    id: 1,
    title: "Creating Compelling Content",
    content: "Learn how to create engaging content that drives results...",
    quiz: {
      questions: [
        {
          question: "How long do you have to hook viewers?",
          options: ["1 second", "3 seconds", "5 seconds", "10 seconds"],
          correct: 1
        },
        {
          question: "What's most important for mobile optimization?", 
          options: ["High resolution", "Vertical format", "Long duration", "Complex editing"],
          correct: 1
        }
      ]
    }
  },
  {
    id: 2,
    title: "Content Strategy",
    content: "Master the art of strategic content creation...",
    quiz: {
      questions: [
        {
          question: "What should drive your content strategy?",
          options: ["Trends", "Audience needs", "Personal preference", "Random ideas"],
          correct: 1
        }
      ]
    }
  }
];

let mockCredits = [
  {
    id: 1,
    user_id: 1,
    amount: 10.0,
    source: "self_promo",
    expiry: "2024-07-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z"
  }
];

let currentUser = null;
let authToken = null;

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Authentication
  async signup(userData) {
    await delay();
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }
    
    const newUser = {
      id: mockUsers.length + 1,
      email: userData.email,
      role: userData.role,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    return newUser;
  },

  async login(email, password) {
    await delay();
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    
    currentUser = user;
    authToken = "mock_jwt_token_" + Date.now();
    
    return {
      access_token: authToken,
      token_type: "bearer",
      user: user
    };
  },

  async getCurrentUser() {
    await delay();
    if (!authToken || !currentUser) {
      throw new Error("Not authenticated");
    }
    return currentUser;
  },

  async logout() {
    currentUser = null;
    authToken = null;
  },

  // Gigs
  async createGig(gigData) {
    await delay();
    if (!currentUser || currentUser.role !== "business_local") {
      throw new Error("Unauthorized");
    }
    
    const newGig = {
      id: mockGigs.length + 1,
      business_id: currentUser.id,
      ...gigData,
      status: "pending",
      created_at: new Date().toISOString()
    };
    
    mockGigs.push(newGig);
    return newGig;
  },

  async getAvailableGigs() {
    await delay();
    return mockGigs.filter(g => g.status === "pending");
  },

  async getMyGigs() {
    await delay();
    if (!currentUser) throw new Error("Not authenticated");
    
    if (currentUser.role === "business_local") {
      return mockGigs.filter(g => g.business_id === currentUser.id);
    } else {
      const mySubmissions = mockSubmissions.filter(s => s.clipper_id === currentUser.id);
      const gigIds = mySubmissions.map(s => s.gig_id);
      return mockGigs.filter(g => gigIds.includes(g.id));
    }
  },

  async claimGig(gigId) {
    await delay();
    if (!currentUser || currentUser.role !== "clipper") {
      throw new Error("Unauthorized");
    }
    
    const gig = mockGigs.find(g => g.id === gigId);
    if (!gig) throw new Error("Gig not found");
    if (gig.status !== "pending") throw new Error("Gig not available");
    
    gig.status = "claimed";
    return gig;
  },

  async submitVideo(gigId, submissionData) {
    await delay();
    if (!currentUser || currentUser.role !== "clipper") {
      throw new Error("Unauthorized");
    }
    
    const newSubmission = {
      id: mockSubmissions.length + 1,
      gig_id: gigId,
      clipper_id: currentUser.id,
      ...submissionData,
      views: 0,
      likes: 0,
      outcomes: 0,
      bonus: 0,
      approved: false,
      created_at: new Date().toISOString()
    };
    
    mockSubmissions.push(newSubmission);
    
    // Update gig status
    const gig = mockGigs.find(g => g.id === gigId);
    if (gig) gig.status = "completed";
    
    return newSubmission;
  },

  // Lessons
  async getLessons() {
    await delay();
    return mockLessons;
  },

  async getLesson(lessonId) {
    await delay();
    const lesson = mockLessons.find(l => l.id === parseInt(lessonId));
    if (!lesson) throw new Error("Lesson not found");
    return lesson;
  },

  async completeQuiz(lessonId, answers) {
    await delay();
    const lesson = mockLessons.find(l => l.id === lessonId);
    if (!lesson) throw new Error("Lesson not found");
    
    // Calculate score
    const questions = lesson.quiz.questions;
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correct) correct++;
    });
    
    const score = (correct / questions.length) * 100;
    const passed = score >= 70;
    
    return {
      score,
      passed,
      correct_answers: correct,
      total_questions: questions.length
    };
  },

  // Dashboard
  async getDashboard() {
    await delay();
    if (!currentUser) throw new Error("Not authenticated");
    
    const userGigs = currentUser.role === "business_local" 
      ? mockGigs.filter(g => g.business_id === currentUser.id)
      : mockGigs.filter(g => mockSubmissions.some(s => s.gig_id === g.id && s.clipper_id === currentUser.id));
    
    const userSubmissions = mockSubmissions.filter(s => 
      currentUser.role === "business_local" 
        ? userGigs.some(g => g.id === s.gig_id)
        : s.clipper_id === currentUser.id
    );
    
    const userCredits = mockCredits.filter(c => c.user_id === currentUser.id);
    const totalCredits = userCredits.reduce((sum, c) => sum + c.amount, 0);
    
    // Calculate stats
    const totalViews = userSubmissions.reduce((sum, s) => sum + s.views, 0);
    const totalLikes = userSubmissions.reduce((sum, s) => sum + s.likes, 0);
    const totalEarnings = userSubmissions.reduce((sum, s) => sum + s.bonus, 0);
    
    return {
      user: currentUser,
      gigs: userGigs,
      submissions: userSubmissions,
      credits: userCredits,
      total_credits: totalCredits,
      stats: {
        total_gigs: userGigs.length,
        total_submissions: userSubmissions.length,
        total_views: totalViews,
        total_likes: totalLikes,
        total_earnings: totalEarnings,
        average_performance: userSubmissions.length > 0 ? totalViews / userSubmissions.length : 0
      }
    };
  },

  // Self-promo
  async submitSelfPromo(promoData) {
    await delay();
    if (!currentUser || currentUser.role !== "business_local") {
      throw new Error("Unauthorized");
    }
    
    // Simulate credit earning (basic validation)
    const views = promoData.views || 0;
    const likes = promoData.likes || 0;
    
    let creditEarned = 0;
    if (views >= 300 && likes >= 30) {
      creditEarned = 10.0;
      
      const newCredit = {
        id: mockCredits.length + 1,
        user_id: currentUser.id,
        amount: creditEarned,
        source: "self_promo",
        expiry: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
        created_at: new Date().toISOString()
      };
      
      mockCredits.push(newCredit);
    }
    
    return {
      credit_earned: creditEarned,
      message: creditEarned > 0 ? "Credit awarded!" : "Minimum requirements not met"
    };
  },

  // File upload simulation
  async uploadFile(file, type = "video") {
    await delay(1000); // Longer delay for file upload
    
    // Simulate file validation
    if (file.size > 50 * 1024 * 1024) { // 50MB
      throw new Error("File too large");
    }
    
    // Return mock URL
    const mockUrl = `https://mock-s3-bucket.com/${type}/${Date.now()}_${file.name}`;
    return { url: mockUrl };
  }
};

// Export for use in other files
export default mockApi; 