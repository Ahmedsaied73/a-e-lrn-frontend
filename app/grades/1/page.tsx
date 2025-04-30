'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Grade1CoursesPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Check if user is logged in by looking for refreshToken in localStorage
    const refreshToken = localStorage.getItem('refreshToken');
    setIsLoggedIn(!!refreshToken);

    // Fetch courses data
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:3005/courses', {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        setCourses(data);
        console.log(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
      }
    };

    if (refreshToken) {
      fetchCourses();
    }
  }, []);

  // Courses data will be fetched from API
  const initialCourses = [
    { 
      id: 1, 
      title: 'شهر (4) أولى ثانوي', 
      description: 'شهر (4) أولى ثانوي',
      image: '/student.svg',
      date: 'الجمعة، 24 أبريل',
      time: 'الخميس، 27 أبريل',
      price: '45.00',
      isNew: true
    },
    { 
      id: 2, 
      title: 'كورس الترمز المكثف المجاني (الصف الأول الثانوي)', 
      description: 'الدورة الثانية فقط 15 طالبًا! سجلنا للترمين الأول والثاني (مجانًا)',
      image: '/student.svg',
      isPopular: true,
      isFree: true
    },
    { 
      id: 3, 
      title: 'كورس المراجعة النهائية (الصف الأول الثانوي)', 
      description: 'مراجعة منهجك المتبقي في النهاية',
      image: '/student.svg',
      discount: 50,
      price: 100,
      likes: 99
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Latest Courses Section */}
      <h1 className="text-3xl font-bold text-white text-center mb-10">أحدث الكورسات</h1>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {courses.map((course: any) => (
          <Card key={course.id} className="bg-[#111827] border-[#1f2937] text-white overflow-hidden">
            {/* Course Image */}
            <div className="relative h-48 w-full overflow-hidden">
              <Image 
                src={course.thumbnail} 
                alt={course.title}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform hover:scale-105"
              />
              {/* Overlay with course info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                <h3 className="text-xl font-bold">{course.title}</h3>
              </div>
            </div>

            <CardContent className="p-4">
              {/* Course Details */}
              <div className="space-y-4">
                {course.description && (
                  <p className="text-gray-300 text-sm">{course.description}</p>
                )}
                
                {/* Date and Time */}
                {course.date && (
                  <div className="flex items-center text-xs text-gray-400">
                    <span>📅 {course.date}</span>
                  </div>
                )}
                {course.time && (
                  <div className="flex items-center text-xs text-gray-400">
                    <span>⏰ {course.time}</span>
                  </div>
                )}
                
                {/* Price and Discount */}
                {course.price && !course.isFree && (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {course.discount ? (
                      <>
                        <span className="text-green-500 font-bold">{course.price - (course.price * course.discount / 100)} ج.م</span>
                        <span className="text-gray-400 line-through text-sm">{course.price} ج.م</span>
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">{course.discount}% خصم</span>
                      </>
                    ) : (
                      <span className="text-white font-bold">{course.price} ج.م</span>
                    )}
                  </div>
                )}
                
                {course.isFree && (
                  <div className="flex items-center">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">مجاني</span>
                  </div>
                )}
                
                {/* Likes */}
                {course.likes && (
                  <div className="flex items-center text-pink-500">
                    <Heart className="h-4 w-4 mr-1 fill-pink-500" />
                    <span>{course.likes}</span>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 pt-2">
                  <Link href={`/course/${course.id}`}>
                    <Button className="bg-[#1f2937] hover:bg-[#374151] text-white border border-[#374151] w-full">
                      الدخول للكورس
                    </Button>
                  </Link>
                  <Button variant="outline" className="border-[#374151] text-white hover:bg-[#1f2937]">
                    اشتراك الآن
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscriptions Section */}
      <div className="bg-[#0A0F1C] rounded-lg p-8 mb-10">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          <span className="text-white">شوف </span>
          <span className="text-green-500">اشتراكاتك</span>
        </h2>
        
        {isLoggedIn ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Subscription cards would go here */}
            <p>بيانات الاشتراكات ستظهر هنا</p>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-300 text-lg">انت غير مشترك بأي كورس حتى الآن!</p>
            <div className="mt-6">
              <Link href="/login">
                <Button className="primary-gradient text-white px-6 py-2 rounded-md hover:opacity-90 transition-opacity">
                  تسجيل الدخول للاشتراك
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}