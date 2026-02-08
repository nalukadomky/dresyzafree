import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { db, Team } from '@/lib/db-supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user || user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Neautorizovaný přístup' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      teamName, 
      contactPerson, 
      phone, 
      email, 
      leagues,
      status,
      numberOfJerseys, 
      numberOfTariffs, 
      deadline, 
      tariffValidUntil, 
      jerseyUrl,
      shortsUrl,
      socksUrl,
      deliveryAddress,
      ico,
      meetingNote
    } = body;

    const updates: Partial<Team> = {};
    if (teamName !== undefined) updates.teamName = teamName;
    if (contactPerson !== undefined) updates.contactPerson = contactPerson;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (leagues !== undefined) updates.leagues = leagues;
    if (status !== undefined) updates.status = status;
    if (numberOfJerseys !== undefined) updates.numberOfJerseys = numberOfJerseys;
    if (numberOfTariffs !== undefined) updates.numberOfTariffs = numberOfTariffs;
    if (deadline !== undefined) updates.deadline = deadline;
    if (tariffValidUntil !== undefined) updates.tariffValidUntil = tariffValidUntil;
    if (jerseyUrl !== undefined) updates.jerseyUrl = jerseyUrl;
    if (shortsUrl !== undefined) updates.shortsUrl = shortsUrl;
    if (socksUrl !== undefined) updates.socksUrl = socksUrl;
    if (deliveryAddress !== undefined) updates.deliveryAddress = deliveryAddress;
    if (ico !== undefined) updates.ico = ico;
    if (meetingNote !== undefined) updates.meetingNote = meetingNote;

    const updatedTeam = await db.teams.update(params.id, updates);
    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Tým nebyl nalezen' },
        { status: 404 }
      );
    }

    // Vrátíme tým bez hesla
    const { password: _, ...teamWithoutPassword } = updatedTeam;

    return NextResponse.json({
      message: 'Tým byl úspěšně aktualizován',
      team: teamWithoutPassword,
    });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: 'Chyba při aktualizaci týmu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user || user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Neautorizovaný přístup' },
        { status: 401 }
      );
    }

    const deleted = await db.teams.delete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Tým nebyl nalezen' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Tým byl úspěšně smazán',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json(
      { error: 'Chyba při mazání týmu' },
      { status: 500 }
    );
  }
}

