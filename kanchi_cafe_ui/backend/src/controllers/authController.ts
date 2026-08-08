import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';
import { logActivity } from '../utils/activityLogger';

export async function loginAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const admin = await prisma.adminUser.findUnique({ where: { email: trimmedEmail } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(trimmedPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken({ id: admin.id, email: admin.email, role: admin.role });

    await logActivity('LOGIN', `Admin logged in (${admin.email})`, admin.email, req.ip);

    return res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
}

export async function getAdminProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!admin) return res.status(404).json({ success: false, message: 'Admin user not found' });

    return res.json({ success: true, admin });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateAdminCredentials(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { email, currentPassword, newPassword } = req.body;

    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin.id } });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    const updateData: any = {};
    if (email && email.toLowerCase() !== admin.email) {
      updateData.email = email.toLowerCase();
    }
    if (newPassword) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.adminUser.update({
      where: { id: req.admin.id },
      data: updateData,
      select: { id: true, email: true, name: true },
    });

    await logActivity('SETTINGS_CHANGE', `Admin credentials updated (${updated.email})`, updated.email, req.ip);

    const newToken = signToken({ id: updated.id, email: updated.email, role: 'ADMIN' });

    return res.json({
      success: true,
      message: 'Admin credentials updated successfully',
      token: newToken,
      admin: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCafeSettings(req: AuthenticatedRequest, res: Response) {
  try {
    let settings = await prisma.cafeSettings.findFirst();
    if (!settings) {
      settings = await prisma.cafeSettings.create({
        data: {
          name: 'Kanchi Cafe',
          address: 'Alkapuri Chourasta, Nagole',
          phone: '9000407970',
          gst: '36AFNFS9271D1ZJ',
          upiId: '8978882601@ybl',
          enableGst: false,
          gstPercentage: 5.0,
        },
      });
    }

    let printerSettings = await prisma.printerSettings.findFirst();
    if (!printerSettings) {
      printerSettings = await prisma.printerSettings.create({
        data: {
          printer1Name: 'Kitchen Printer (Food)',
          printer1Categories: 'Breakfast,Snacks,South Indian,Desserts,Main Course',
          printer2Name: 'Beverage Printer (Coffee & Juices)',
          printer2Categories: 'Coffee & Beverages,Juices,Shakes',
        },
      });
    }

    return res.json({
      success: true,
      settings,
      printerSettings,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCafeSettings(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      name,
      address,
      phone,
      gst,
      upiId,
      logoUrl,
      customerNotifDelayMin,
      reminderIntervalMin,
      autoCompleteTimeoutMin,
      enableGst,
      gstPercentage,
      printer1Name,
      printer1Categories,
      printer2Name,
      printer2Categories,
    } = req.body;

    const existingSettings = await prisma.cafeSettings.findFirst();
    const settingsId = existingSettings?.id;

    const updatedSettings = await prisma.cafeSettings.upsert({
      where: { id: settingsId || 'default' },
      update: {
        ...(name && { name }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(gst && { gst }),
        ...(upiId && { upiId }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(customerNotifDelayMin !== undefined && { customerNotifDelayMin: Number(customerNotifDelayMin) }),
        ...(reminderIntervalMin !== undefined && { reminderIntervalMin: Number(reminderIntervalMin) }),
        ...(autoCompleteTimeoutMin !== undefined && { autoCompleteTimeoutMin: Number(autoCompleteTimeoutMin) }),
        ...(enableGst !== undefined && { enableGst: Boolean(enableGst) }),
        ...(gstPercentage !== undefined && { gstPercentage: Number(gstPercentage) }),
      },
      create: {
        name: name || 'Kanchi Cafe',
        address: address || 'Alkapuri Chourasta, Nagole',
        phone: phone || '9000407970',
        gst: gst || '36AFNFS9271D1ZJ',
        upiId: upiId || '8978882601@ybl',
        logoUrl: logoUrl || null,
        customerNotifDelayMin: Number(customerNotifDelayMin) || 30,
        reminderIntervalMin: Number(reminderIntervalMin) || 15,
        autoCompleteTimeoutMin: Number(autoCompleteTimeoutMin) || 60,
        enableGst: enableGst !== undefined ? Boolean(enableGst) : false,
        gstPercentage: gstPercentage !== undefined ? Number(gstPercentage) : 5.0,
      },
    });

    const existingPrinter = await prisma.printerSettings.findFirst();
    const updatedPrinter = await prisma.printerSettings.upsert({
      where: { id: existingPrinter?.id || 'default' },
      update: {
        ...(printer1Name && { printer1Name }),
        ...(printer1Categories && { printer1Categories }),
        ...(printer2Name && { printer2Name }),
        ...(printer2Categories && { printer2Categories }),
      },
      create: {
        printer1Name: printer1Name || 'Kitchen Printer (Food)',
        printer1Categories: printer1Categories || 'Breakfast,Snacks,South Indian,Desserts,Main Course',
        printer2Name: printer2Name || 'Beverage Printer (Coffee & Juices)',
        printer2Categories: printer2Categories || 'Coffee & Beverages,Juices,Shakes',
      },
    });

    await logActivity('SETTINGS_CHANGE', 'Cafe branding & system settings updated', req.admin.email, req.ip);

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings,
      printerSettings: updatedPrinter,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
