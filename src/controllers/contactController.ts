import {prisma} from '../db/prisma'
import { Request, Response } from 'express';


export const contact = async(req:Request,res:Response)=>{
    const { email, phoneNumber } = req.body;

    try {
        const existingContacts = await prisma.contact.findMany({
            where: {
              OR: [
                { email },
                { phoneNumber }
              ],
              deletedAt: null
            }
          });

          if (existingContacts.length === 0) {
            // No matching contacts, create a new primary contact
            const newContact = await prisma.contact.create({
              data: {
                phoneNumber,
                email,
                linkPrecedence: 'primary'
              }
            });
            return res.json({
              contact: {
                primaryContatctId: newContact.id,
                emails: [email].filter(Boolean),
                phoneNumbers: [phoneNumber].filter(Boolean),
                secondaryContactIds: []
              }
            });
          }

              // Group by primary contact
    let primaryContact = existingContacts.find(c => c.linkPrecedence === 'primary');
    if (!primaryContact) {
      primaryContact = existingContacts[0];
      await prisma.contact.update({
        where: { id: primaryContact.id },
        data: { linkPrecedence: 'primary' }
      });
    }

    // Link secondary contacts
    const secondaryContactIds: number[] = [];
    for (const contact of existingContacts) {
      if (contact.id !== primaryContact.id) {
        if (contact.linkPrecedence === 'primary') {
          await prisma.contact.update({
            where: { id: contact.id },
            data: { linkPrecedence: 'secondary', linkedId: primaryContact.id }
          });
        }
        secondaryContactIds.push(contact.id);
      }
    }

    // If new contact info doesn't match any existing contact, create a secondary contact
    if (!existingContacts.some(c => c.email === email && c.phoneNumber === phoneNumber)) {
      const newContact = await prisma.contact.create({
        data: {
          phoneNumber,
          email,
          linkedId: primaryContact.id,
          linkPrecedence: 'secondary'
        }
      });
      secondaryContactIds.push(newContact.id);
    }

    // Gather all related contacts
    const allContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id }
        ],
        deletedAt: null
      }
    });

    const emails = [...new Set(allContacts.map(c => c.email).filter(Boolean))];
    const phoneNumbers = [...new Set(allContacts.map(c => c.phoneNumber).filter(Boolean))];

    res.json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    });






    } catch (error) {
        res.json({error});
    }

}

