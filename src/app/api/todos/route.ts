import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        order: 'asc'
      }
    });
    return NextResponse.json(todos || []);
  } catch (error) {
    console.error('Error in GET /api/todos:', error);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const lastTodo = await prisma.todo.findFirst({
      orderBy: {
        order: 'desc'
      }
    });
    
    const newOrder = lastTodo ? lastTodo.order + 1 : 0;
    
    const todo = await prisma.todo.create({
      data: {
        content,
        order: newOrder,
        userId: "placeholder"
      }
    });
    
    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, completed, order } = await req.json();
    const todo = await prisma.todo.update({
      where: { id },
      data: { completed, order },
    });
    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.todo.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
} 