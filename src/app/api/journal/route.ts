import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const entries = await prisma.journalEntry.findMany({
      orderBy: {
        date: 'desc'  // Show newest entries first
      }
    });
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { content, date } = await request.json();
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Try to find an existing entry for this date
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        date: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
    });

    if (existingEntry) {
      // Update existing entry
      const updatedEntry = await prisma.journalEntry.update({
        where: {
          id: existingEntry.id,
        },
        data: {
          content,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updatedEntry);
    } else {
      // Create new entry if none exists for this date
      const newEntry = await prisma.journalEntry.create({
        data: {
          content,
          date: new Date(date),
        },
      });
      return NextResponse.json(newEntry);
    }
  } catch (error) {
    console.error("Failed to save entry:", error);
    return NextResponse.json(
      { error: "Failed to save entry" },
      { status: 500 }
    );
  }
} 